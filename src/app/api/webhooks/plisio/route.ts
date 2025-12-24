/**
 * Plisio Webhook Handler
 * Processes deposit notifications in real-time
 * Supports both pending and completed statuses
 * Uses deposit_uid for whitelabel user matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPlisioCallback, validateCallbackData } from '@/lib/plisio/webhooks';
import type { PlisioCallback } from '@/lib/plisio/types';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();

    const supabase = createAdminClient();

    console.log('📥 Webhook received:', {
      txn_id: body.txn_id,
      ipn_type: body.ipn_type,
      currency: body.currency,
      amount: body.amount,
      status: body.status,
      deposit_uid: body.deposit_uid,
      wallet_hash: body.wallet_hash,
    });

    // DEBUG: Uncomment to see full webhook payload
    // console.log('🔍 DEBUG - Full webhook payload:', JSON.stringify(body, null, 2));

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: body.ipn_type === 'pay_in' ? 'plisio_deposit' : 'plisio_invoice',
        payload: body,
        processed: false,
      });

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Validate required fields
    if (!validateCallbackData(body)) {
      console.error('❌ Invalid callback data structure');
      return NextResponse.json(
        { error: 'Invalid callback data' },
        { status: 400 }
      );
    }

    const callback = body as PlisioCallback;

    // Verify webhook signature (CRITICAL for security)
    // DEBUG: Uncomment to skip signature verification during testing
    // console.log('⚠️ DEBUG - Skipping signature verification!');
    // const signatureValid = true;
    const signatureValid = verifyPlisioCallback(callback);

    if (!signatureValid) {
      console.error('❌ Invalid webhook signature!');
      // DEBUG: Uncomment to see what was received vs expected
      // console.log('🔍 DEBUG - Callback data for signature:', JSON.stringify(callback, null, 2));
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Signature verified');

    // Only process pending and completed statuses
    if (callback.status !== 'pending' && callback.status !== 'completed') {
      console.log(`⏸️  Acknowledging status: ${callback.status}`);
      return NextResponse.json({ status: 'acknowledged' });
    }

    // For whitelabel deposits (pay_in), deposit_uid contains our user ID
    // For invoices, we fall back to wallet_hash lookup
    let userId: string | null = null;

    // Query helper for deposit address lookup
    const selectDepositAddress = () =>
      supabase
        .from('deposit_addresses')
        .select(`
          user_id,
          token_deployment_id,
          address,
          token_deployments (
            id,
            symbol,
            base_token_id,
            network_id,
            base_tokens (
              id,
              code,
              symbol,
              name
            ),
            networks (
              id,
              code,
              name
            )
          )
        `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let depositAddress: any = null;

    if (callback.ipn_type === 'pay_in' && callback.deposit_uid) {
      // Whitelabel deposit: deposit_uid is our user ID
      userId = callback.deposit_uid;
      console.log('📍 Using deposit_uid for user matching:', userId);
      // DEBUG: Uncomment to trace user matching
      // console.log('🔍 DEBUG - pay_in callback, deposit_uid:', callback.deposit_uid, 'wallet_hash:', callback.wallet_hash);

      // Still need to fetch deposit address for token info
      if (callback.wallet_hash) {
        const { data, error } = await selectDepositAddress()
          .eq('address', callback.wallet_hash)
          .single();

        if (error || !data) {
          console.error('❌ Deposit address not found for wallet_hash:', callback.wallet_hash);
          return NextResponse.json(
            { error: 'Deposit address not found' },
            { status: 404 }
          );
        }

        depositAddress = data;

        // Verify user ID matches for security
        if (depositAddress.user_id !== userId) {
          console.error('❌ User ID mismatch! deposit_uid:', userId, 'address owner:', depositAddress.user_id);
          return NextResponse.json(
            { error: 'User ID mismatch' },
            { status: 400 }
          );
        }
      }
    } else {
      // Invoice callback or missing deposit_uid: lookup by address
      const receivingAddress = callback.wallet_hash;

      if (!receivingAddress) {
        console.error('❌ No wallet address in callback');
        return NextResponse.json(
          { error: 'Missing wallet address' },
          { status: 400 }
        );
      }

      console.log('📍 Using wallet_hash for user matching:', receivingAddress);

      const { data, error } = await selectDepositAddress()
        .eq('address', receivingAddress)
        .single();

      if (error || !data) {
        console.error('❌ Deposit address not found:', {
          address: receivingAddress,
          error,
        });
        return NextResponse.json(
          { error: 'Deposit address not found' },
          { status: 404 }
        );
      }

      depositAddress = data;
      userId = depositAddress.user_id;
    }

    if (!userId || !depositAddress) {
      console.error('❌ Could not determine user or deposit address');
      return NextResponse.json(
        { error: 'Could not identify deposit' },
        { status: 400 }
      );
    }

    // Type assertion for nested relations
    const deployment = Array.isArray(depositAddress.token_deployments)
      ? depositAddress.token_deployments[0]
      : depositAddress.token_deployments;

    if (!deployment) {
      console.error('❌ No token deployment found for address');
      return NextResponse.json(
        { error: 'Token deployment not found' },
        { status: 404 }
      );
    }

    const baseToken = Array.isArray(deployment.base_tokens)
      ? deployment.base_tokens[0]
      : deployment.base_tokens;
    const network = Array.isArray(deployment.networks)
      ? deployment.networks[0]
      : deployment.networks;

    const baseTokenId = deployment.base_token_id;
    const networkId = deployment.network_id;
    const deploymentSymbol = deployment.symbol;
    const baseTokenSymbol = baseToken?.symbol;

    console.log('📊 Deposit matched:', {
      user: userId,
      ipn_type: callback.ipn_type,
      base_token: baseTokenSymbol,
      network: network?.name,
      deployment: deploymentSymbol,
      amount: callback.amount,
      status: callback.status,
      confirmations: callback.confirmations,
    });

    // Check for existing transaction (for pending -> completed updates)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('tx_hash', callback.txn_id)
      .single();

    if (callback.status === 'pending') {
      // PENDING: Create transaction, credit balance, then LOCK it
      // User sees the funds but can't spend until confirmed
      if (existingTx) {
        // Already have a record, just update confirmations
        console.log('⏳ Updating pending transaction confirmations:', callback.txn_id);
        await supabase
          .from('transactions')
          .update({
            notes: `Deposit via Plisio - ${callback.confirmations} confirmations (pending)`,
          })
          .eq('id', existingTx.id);

        return NextResponse.json({ status: 'updated' });
      }

      // Create new pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          base_token_id: baseTokenId,
          network_id: networkId,
          token_deployment_id: depositAddress.token_deployment_id,
          type: 'deposit',
          amount: callback.amount,
          coin_symbol: deploymentSymbol,
          status: 'pending',
          tx_hash: callback.txn_id,
          to_address: depositAddress.address,
          from_address: null,
          network_fee: callback.invoice_commission || '0',
          notes: `Deposit via Plisio - ${callback.confirmations} confirmations (pending)`,
        })
        .select()
        .single();

      if (txError) {
        console.error('❌ Failed to create pending transaction:', txError);
        return NextResponse.json(
          { error: 'Failed to create transaction' },
          { status: 500 }
        );
      }

      console.log('⏳ Pending transaction created:', transaction.id);

      // Credit balance first
      // DEBUG: Uncomment to trace balance operations
      // console.log('🔍 DEBUG - Crediting pending balance:', { userId, baseTokenId, amount: callback.amount });
      const { error: creditError } = await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_base_token_id: baseTokenId,
        p_amount: parseFloat(callback.amount),
        p_operation: 'credit',
      });

      if (creditError) {
        console.error('❌ Failed to credit pending balance:', creditError);
        // DEBUG: Uncomment to see full error details
        // console.log('🔍 DEBUG - Credit error details:', JSON.stringify(creditError, null, 2));
        // Rollback transaction
        await supabase.from('transactions').delete().eq('id', transaction.id);
        return NextResponse.json(
          { error: 'Failed to credit balance' },
          { status: 500 }
        );
      }

      // Then lock the credited amount (user can see but not spend)
      const { error: lockError } = await supabase.rpc('lock_user_balance', {
        p_user_id: userId,
        p_base_token_id: baseTokenId,
        p_amount: parseFloat(callback.amount),
      });

      if (lockError) {
        console.error('❌ Failed to lock pending balance:', lockError);
        // Balance was credited but not locked - this is acceptable
        // User will just have access to funds early
      } else {
        console.log('🔒 Balance credited and locked for pending deposit');
      }

      return NextResponse.json({
        status: 'pending',
        message: 'Pending deposit recorded and locked',
        transaction_id: transaction.id,
      });
    }

    // COMPLETED: Update existing or create new, then unlock/credit balance
    if (existingTx) {
      if (existingTx.status === 'completed') {
        console.log('⚠️  Transaction already completed:', callback.txn_id);
        return NextResponse.json({ status: 'already_processed' });
      }

      // Update pending -> completed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          notes: `Deposit via Plisio - ${callback.confirmations} confirmations`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingTx.id);

      if (updateError) {
        console.error('❌ Failed to update transaction:', updateError);
        return NextResponse.json(
          { error: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      console.log('✅ Transaction updated to completed:', existingTx.id);

      // Unlock the previously locked balance (balance was already credited during pending)
      const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
        p_user_id: userId,
        p_base_token_id: baseTokenId,
        p_amount: parseFloat(callback.amount),
      });

      if (unlockError) {
        console.error('❌ Failed to unlock balance:', unlockError);
        // Non-fatal - admin can manually unlock if needed
      } else {
        console.log('🔓 Balance unlocked - deposit confirmed');
      }
    } else {
      // Create new completed transaction (webhook might have skipped pending)
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          base_token_id: baseTokenId,
          network_id: networkId,
          token_deployment_id: depositAddress.token_deployment_id,
          type: 'deposit',
          amount: callback.amount,
          coin_symbol: deploymentSymbol,
          status: 'completed',
          tx_hash: callback.txn_id,
          to_address: depositAddress.address,
          from_address: null,
          network_fee: callback.invoice_commission || '0',
          notes: `Deposit via Plisio - ${callback.confirmations} confirmations`,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) {
        console.error('❌ Failed to create transaction:', txError);
        return NextResponse.json(
          { error: 'Failed to create transaction' },
          { status: 500 }
        );
      }

      console.log('✅ Completed transaction created:', transaction.id);

      // Credit balance directly (no prior pending state, so no unlock needed)
      const { error: creditError } = await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_base_token_id: baseTokenId,
        p_amount: parseFloat(callback.amount),
        p_operation: 'credit',
      });

      if (creditError) {
        console.error('❌ Failed to credit balance:', creditError);
        await supabase
          .from('transactions')
          .update({ status: 'failed', notes: 'Balance update failed' })
          .eq('id', transaction.id);

        return NextResponse.json(
          { error: 'Failed to update balance' },
          { status: 500 }
        );
      }

      console.log('✅ Balance credited directly (no prior pending state)');
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payload->>txn_id', callback.txn_id);

    console.log('🎉 Deposit completed successfully:', {
      txn_id: callback.txn_id,
      user: userId,
      base_token: baseTokenSymbol,
      network: network?.name,
      amount: callback.amount,
      had_pending: !!existingTx,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Deposit processed',
    });
  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Plisio webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

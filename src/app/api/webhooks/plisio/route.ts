/**
 * Plisio Webhook Handler
 * Processes deposit notifications in real-time
 * Next.js 15 compatible
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPlisioCallback, validateCallbackData } from '@/lib/plisio/webhooks';
import type { PlisioCallback } from '@/lib/plisio/types';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();

    console.log('📥 Webhook received:', {
      txn_id: body.txn_id,
      currency: body.currency,
      amount: body.amount,
      status: body.status,
    });

    // Log the webhook event
    const supabase = createAdminClient();

    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'plisio_deposit',
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
    if (!verifyPlisioCallback(callback)) {
      console.error('❌ Invalid webhook signature!');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Signature verified');

    // Only process completed deposits
    if (callback.status !== 'completed') {
      console.log(`⏸️  Skipping non-completed status: ${callback.status}`);
      return NextResponse.json({ status: 'acknowledged' });
    }

    // For deposit endpoint (permanent addresses), we need to find wallet by address
    // The callback might not have order_number for cash_in operations
    // We need to get the wallet_hash from Plisio's callback

    // First, try to get the receiving address from callback
    // Note: This might be in different fields depending on callback type
    const receivingAddress = (callback as unknown as { wallet_hash?: string }).wallet_hash;

    if (!receivingAddress) {
      console.error('❌ No wallet address in callback');
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    console.log('Processing deposit to address:', receivingAddress);

    // Find deposit address and get token deployment info
    const { data: depositAddress, error: addressError } = await supabase
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
      `)
      .eq('address', receivingAddress)
      .single();

    if (addressError || !depositAddress) {
      console.error('❌ Deposit address not found:', {
        address: receivingAddress,
        error: addressError,
      });
      return NextResponse.json(
        { error: 'Deposit address not found' },
        { status: 404 }
      );
    }

    const userId = depositAddress.user_id;

    // Type assertion for nested relations
    const deployment = Array.isArray(depositAddress.token_deployments)
      ? depositAddress.token_deployments[0]
      : depositAddress.token_deployments;
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

    console.log('Deposit matched to address:', {
      user: userId,
      base_token: baseTokenSymbol,
      network: network?.name,
      deployment: deploymentSymbol,
      amount: callback.amount,
    });

    // Check for duplicate transaction
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', callback.txn_id)
      .single();

    if (existingTx) {
      console.log('⚠️  Transaction already processed:', callback.txn_id);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Create transaction record with new schema
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        base_token_id: baseTokenId,
        network_id: networkId,
        token_deployment_id: depositAddress.token_deployment_id,
        type: 'deposit',
        amount: callback.amount,
        coin_symbol: deploymentSymbol, // Keep for backward compatibility
        status: 'completed',
        tx_hash: callback.txn_id,
        to_address: depositAddress.address,
        from_address: null, // Plisio doesn't provide sender address
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

    console.log('✅ Transaction created:', transaction.id);

    // Credit user balance using new atomic function
    const { data: balanceResult, error: balanceError } = await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_base_token_id: baseTokenId,
      p_amount: parseFloat(callback.amount),
      p_operation: 'credit',
    });

    if (balanceError) {
      console.error('❌ Failed to update balance:', balanceError);
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed', notes: 'Balance update failed' })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    console.log('✅ Balance updated:', balanceResult);

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payload->>txn_id', callback.txn_id);

    console.log('🎉 Deposit processed successfully:', {
      txn_id: callback.txn_id,
      user: userId,
      base_token: baseTokenSymbol,
      network: network?.name,
      amount: callback.amount,
      new_balance: balanceResult.balance,
      available_balance: balanceResult.available_balance,
    });

    // TODO: Send email notification to user about deposit
    // Need to: Get user email from profile, then send deposit confirmation email
    // Template needed: DepositConfirmationEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', userId)
    //   .single();
    // if (userProfile) {
    //   await sendDepositConfirmationEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     amount: callback.amount,
    //     coinSymbol: coinSymbol,
    //     txHash: callback.txn_id,
    //   });
    // }

    return NextResponse.json({
      status: 'success',
      message: 'Deposit processed',
      transaction_id: transaction.id,
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

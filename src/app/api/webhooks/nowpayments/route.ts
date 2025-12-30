/**
 * NOWPayments Webhook Handler (IPN)
 * Processes deposit notifications from NOWPayments in real-time
 *
 * Supports two deposit flows:
 * 1. Invoice-style deposits (XRP, XLM) - looked up in deposit_payments table by payment_id
 * 2. Permanent address deposits (SOL, ADA) - looked up in deposit_addresses table by address
 *
 * Supports payment statuses:
 * - waiting: Payment created, waiting for customer
 * - confirming: Payment detected, waiting for confirmations
 * - confirmed: Payment confirmed on blockchain
 * - sending: Sending to merchant wallet (non-custody)
 * - finished: Payment completed
 * - partially_paid: Customer sent less than required
 * - failed/refunded/expired: Error states
 *
 * Uses order_id for user matching (contains user ID from payment creation)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyNowPaymentsSignature,
  validatePaymentCallback,
  mapPaymentStatus,
  shouldCreditBalance,
} from '@/lib/nowpayments/webhooks';
import type { NowPaymentsIPNCallback } from '@/lib/nowpayments/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendDepositConfirmationEmail } from '@/lib/email/helpers';

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();

    // Get signature from header
    const signature = request.headers.get('x-nowpayments-sig') || '';

    const supabase = createAdminClient();

    console.log('📥 NOWPayments webhook received:', {
      payment_id: body.payment_id,
      payment_status: body.payment_status,
      pay_currency: body.pay_currency,
      actually_paid: body.actually_paid,
      order_id: body.order_id,
      pay_address: body.pay_address,
    });

    // Log the webhook event
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'nowpayments_payment',
        payload: body,
        processed: false,
      });

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Validate required fields
    if (!validatePaymentCallback(body)) {
      console.error('❌ Invalid callback data structure');
      return NextResponse.json(
        { error: 'Invalid callback data' },
        { status: 400 }
      );
    }

    const callback = body as NowPaymentsIPNCallback;

    // Verify webhook signature (CRITICAL for security)
    const skipSignatureVerification =
      process.env.SKIP_NOWPAYMENTS_SIGNATURE_VERIFICATION === 'true';

    if (skipSignatureVerification) {
      console.warn(
        '⚠️⚠️⚠️ NOWPAYMENTS SIGNATURE VERIFICATION DISABLED - FOR DEBUGGING ONLY ⚠️⚠️⚠️'
      );
    }

    const signatureValid =
      skipSignatureVerification ||
      verifyNowPaymentsSignature(body, signature);

    if (!signatureValid) {
      console.error('❌ Invalid webhook signature!');
      console.error('🔍 Received signature:', signature);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(
      '✅ Signature verified',
      skipSignatureVerification ? '(SKIPPED!)' : ''
    );

    // Map NOWPayments status to our internal status
    const internalStatus = mapPaymentStatus(callback.payment_status);

    // Extract user ID from order_id (set during payment creation)
    const userId = callback.order_id;

    if (!userId) {
      console.error('❌ No order_id (user ID) in callback');
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    // ============================================
    // FLOW 1: Check for invoice-style deposit (XRP, XLM, etc.)
    // These are tracked in deposit_payments table by payment_id
    // ============================================
    const { data: depositPayment } = await supabase
      .from('deposit_payments')
      .select(
        `
        id,
        user_id,
        base_token_id,
        network_id,
        pay_address,
        extra_id,
        expected_amount,
        pay_currency,
        status,
        base_tokens (
          id,
          code,
          symbol,
          name
        )
      `
      )
      .eq('external_payment_id', String(callback.payment_id))
      .single();

    if (depositPayment) {
      console.log('📋 Invoice-style deposit found:', {
        deposit_id: depositPayment.id,
        payment_id: callback.payment_id,
        currency: depositPayment.pay_currency,
      });

      // Verify user ID matches
      if (depositPayment.user_id !== userId) {
        console.error(
          '❌ User ID mismatch! order_id:',
          userId,
          'deposit owner:',
          depositPayment.user_id
        );
        return NextResponse.json({ error: 'User ID mismatch' }, { status: 400 });
      }

      // Update deposit_payments status
      const updateData: Record<string, unknown> = {
        status: callback.payment_status,
        updated_at: new Date().toISOString(),
      };

      if (callback.actually_paid > 0) {
        updateData.actually_paid = callback.actually_paid;
        updateData.actually_paid_fiat = callback.actually_paid_at_fiat;
      }

      if (callback.payin_hash) {
        updateData.tx_hash = callback.payin_hash;
      }

      await supabase
        .from('deposit_payments')
        .update(updateData)
        .eq('id', depositPayment.id);

      // Only process statuses that matter for balance updates
      if (!shouldCreditBalance(callback.payment_status)) {
        console.log(
          `⏸️  Invoice deposit status update: ${callback.payment_status}`
        );
        return NextResponse.json({ status: 'acknowledged' });
      }

      // Type assertion for nested relation (Supabase returns object not array for single FK)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseTokenRaw = depositPayment.base_tokens as any;
      const baseToken = Array.isArray(baseTokenRaw)
        ? baseTokenRaw[0]
        : baseTokenRaw as {
            id: number;
            code: string;
            symbol: string;
            name: string;
          } | null;

      const baseTokenId = depositPayment.base_token_id;
      const networkId = depositPayment.network_id;
      const baseTokenSymbol = baseToken?.symbol || depositPayment.pay_currency.toUpperCase();

      // Use actually_paid for the amount
      const amount = callback.actually_paid;
      const amountStr = amount.toString();

      console.log('📊 Invoice deposit processing:', {
        user: userId,
        base_token: baseTokenSymbol,
        amount: amount,
        status: callback.payment_status,
      });

      // Check for existing transaction
      const txHash = `nowpayments_${callback.payment_id}`;
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, status, amount')
        .eq('tx_hash', txHash)
        .single();

      if (callback.payment_status === 'confirmed') {
        if (existingTx) {
          console.log('⏳ Invoice transaction already exists');
          return NextResponse.json({ status: 'already_exists' });
        }

        // Create pending transaction
        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            base_token_id: baseTokenId,
            network_id: networkId,
            type: 'deposit',
            amount: amountStr,
            coin_symbol: baseTokenSymbol,
            status: 'pending',
            tx_hash: txHash,
            to_address: depositPayment.pay_address,
            network_fee: '0',
            notes: `Invoice deposit via NOWPayments - confirmed (payment_id: ${callback.payment_id})`,
          })
          .select()
          .single();

        if (txError) {
          console.error('❌ Failed to create invoice transaction:', txError);
          return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
          );
        }

        console.log('⏳ Invoice pending transaction created:', transaction.id);

        // Credit and lock balance
        if (amount > 0) {
          const { error: creditError } = await supabase.rpc('update_user_balance', {
            p_user_id: userId,
            p_base_token_id: baseTokenId,
            p_amount: amount,
            p_operation: 'credit',
          });

          if (creditError) {
            console.error('❌ Failed to credit invoice balance:', creditError);
            await supabase.from('transactions').delete().eq('id', transaction.id);
            return NextResponse.json(
              { error: 'Failed to credit balance' },
              { status: 500 }
            );
          }

          const { error: lockError } = await supabase.rpc('lock_user_balance', {
            p_user_id: userId,
            p_base_token_id: baseTokenId,
            p_amount: amount,
          });

          if (lockError) {
            console.error('❌ Failed to lock invoice balance:', lockError);
          } else {
            console.log('🔒 Invoice balance credited and locked');
          }
        }

        return NextResponse.json({
          status: 'pending',
          message: 'Invoice deposit confirmed and locked',
          transaction_id: transaction.id,
        });
      }

      if (callback.payment_status === 'finished') {
        if (existingTx) {
          if (existingTx.status === 'completed') {
            console.log('⚠️  Invoice transaction already completed:', txHash);
            return NextResponse.json({ status: 'already_processed' });
          }

          // Update pending -> completed
          const pendingAmount = parseFloat(existingTx.amount || '0');

          await supabase
            .from('transactions')
            .update({
              status: 'completed',
              amount: amountStr,
              notes: `Invoice deposit via NOWPayments - finished (payment_id: ${callback.payment_id})`,
              completed_at: new Date().toISOString(),
            })
            .eq('id', existingTx.id);

          console.log('✅ Invoice transaction completed:', existingTx.id);

          if (pendingAmount > 0) {
            const { error: unlockError } = await supabase.rpc(
              'unlock_user_balance',
              {
                p_user_id: userId,
                p_base_token_id: baseTokenId,
                p_amount: pendingAmount,
              }
            );

            if (unlockError) {
              console.error('❌ Failed to unlock invoice balance:', unlockError);
            } else {
              console.log('🔓 Invoice balance unlocked');
            }
          }
        } else {
          // Create new completed transaction
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              base_token_id: baseTokenId,
              network_id: networkId,
              type: 'deposit',
              amount: amountStr,
              coin_symbol: baseTokenSymbol,
              status: 'completed',
              tx_hash: txHash,
              to_address: depositPayment.pay_address,
              network_fee: '0',
              notes: `Invoice deposit via NOWPayments - finished (payment_id: ${callback.payment_id})`,
              completed_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (txError) {
            console.error('❌ Failed to create invoice transaction:', txError);
            return NextResponse.json(
              { error: 'Failed to create transaction' },
              { status: 500 }
            );
          }

          console.log('✅ Invoice completed transaction created:', transaction.id);

          if (amount > 0) {
            const { error: creditError } = await supabase.rpc(
              'update_user_balance',
              {
                p_user_id: userId,
                p_base_token_id: baseTokenId,
                p_amount: amount,
                p_operation: 'credit',
              }
            );

            if (creditError) {
              console.error('❌ Failed to credit invoice balance:', creditError);
              await supabase
                .from('transactions')
                .update({ status: 'failed', notes: 'Balance credit failed' })
                .eq('id', transaction.id);
              return NextResponse.json(
                { error: 'Failed to credit balance' },
                { status: 500 }
              );
            }

            console.log('✅ Invoice balance credited directly');
          }
        }

        // Mark webhook as processed
        await supabase
          .from('webhook_logs')
          .update({ processed: true })
          .eq('payload->>payment_id', String(callback.payment_id));

        console.log('🎉 Invoice deposit completed:', {
          payment_id: callback.payment_id,
          user: userId,
          amount: amount,
        });

        // Send deposit confirmation email
        try {
          const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name, notification_preferences')
            .eq('id', userId)
            .single();

          if (user?.email) {
            const prefs = user.notification_preferences as {
              email_deposits?: boolean;
            } | null;
            const shouldSendEmail = prefs?.email_deposits !== false;

            if (shouldSendEmail) {
              const { data: balance } = await supabase
                .from('user_balances')
                .select('balance')
                .eq('user_id', userId)
                .eq('base_token_id', baseTokenId)
                .single();

              await sendDepositConfirmationEmail({
                email: user.email,
                recipientName: user.full_name || 'Valued Customer',
                amount: amountStr,
                coinSymbol: baseTokenSymbol,
                txHash: `NOWPayments #${callback.payment_id}`,
                newBalance: balance?.balance,
              });
              console.log('📧 Invoice deposit email sent');
            }
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send invoice deposit email:', emailError);
        }

        return NextResponse.json({
          status: 'success',
          message: 'Invoice deposit processed',
        });
      }

      return NextResponse.json({ status: 'acknowledged' });
    }

    // ============================================
    // FLOW 2: Permanent address deposit (SOL, ADA, etc.)
    // Look up by pay_address in deposit_addresses table
    // ============================================

    // Only process statuses that matter for balance updates
    if (!shouldCreditBalance(callback.payment_status)) {
      console.log(
        `⏸️  Acknowledging status: ${callback.payment_status} (internal: ${internalStatus})`
      );
      return NextResponse.json({ status: 'acknowledged' });
    }

    // Look up deposit address by pay_address
    const { data: depositAddress, error: addressError } = await supabase
      .from('deposit_addresses')
      .select(
        `
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
      `
      )
      .eq('address', callback.pay_address)
      .single();

    if (addressError || !depositAddress) {
      console.error('❌ Deposit address not found:', {
        address: callback.pay_address,
        error: addressError,
      });
      return NextResponse.json(
        { error: 'Deposit address not found' },
        { status: 404 }
      );
    }

    // Verify user ID matches for security
    if (depositAddress.user_id !== userId) {
      console.error(
        '❌ User ID mismatch! order_id:',
        userId,
        'address owner:',
        depositAddress.user_id
      );
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 400 });
    }

    // Type assertion for nested relations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deployment = Array.isArray((depositAddress as any).token_deployments)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (depositAddress as any).token_deployments[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (depositAddress as any).token_deployments;

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

    // Use actually_paid for the amount (what was actually received)
    const amount = callback.actually_paid;
    const amountStr = amount.toString();

    console.log('📊 NOWPayments deposit matched:', {
      user: userId,
      base_token: baseTokenSymbol,
      network: network?.name,
      deployment: deploymentSymbol,
      amount: amount,
      status: callback.payment_status,
      internal_status: internalStatus,
    });

    // Check for existing transaction
    const txHash = `nowpayments_${callback.payment_id}`;
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, status, amount')
      .eq('tx_hash', txHash)
      .single();

    if (callback.payment_status === 'confirmed') {
      // CONFIRMED: Create pending transaction and lock balance
      if (existingTx) {
        console.log('⏳ Transaction already exists for confirmed status');
        return NextResponse.json({ status: 'already_exists' });
      }

      // Create pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          base_token_id: baseTokenId,
          network_id: networkId,
          token_deployment_id: depositAddress.token_deployment_id,
          type: 'deposit',
          amount: amountStr,
          coin_symbol: deploymentSymbol,
          status: 'pending',
          tx_hash: txHash,
          to_address: depositAddress.address,
          from_address: null,
          network_fee: '0',
          notes: `Deposit via NOWPayments - confirmed (payment_id: ${callback.payment_id})`,
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

      // Credit and lock balance
      if (amount > 0) {
        const { error: creditError } = await supabase.rpc('update_user_balance', {
          p_user_id: userId,
          p_base_token_id: baseTokenId,
          p_amount: amount,
          p_operation: 'credit',
        });

        if (creditError) {
          console.error('❌ Failed to credit pending balance:', creditError);
          await supabase.from('transactions').delete().eq('id', transaction.id);
          return NextResponse.json(
            { error: 'Failed to credit balance' },
            { status: 500 }
          );
        }

        // Lock the credited amount
        const { error: lockError } = await supabase.rpc('lock_user_balance', {
          p_user_id: userId,
          p_base_token_id: baseTokenId,
          p_amount: amount,
        });

        if (lockError) {
          console.error('❌ Failed to lock pending balance:', lockError);
        } else {
          console.log('🔒 Balance credited and locked for pending deposit');
        }
      }

      return NextResponse.json({
        status: 'pending',
        message: 'Deposit confirmed and locked',
        transaction_id: transaction.id,
      });
    }

    // FINISHED: Complete the deposit
    if (callback.payment_status === 'finished') {
      if (existingTx) {
        if (existingTx.status === 'completed') {
          console.log('⚠️  Transaction already completed:', txHash);
          return NextResponse.json({ status: 'already_processed' });
        }

        // Update pending -> completed
        const pendingAmount = parseFloat(existingTx.amount || '0');

        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            amount: amountStr,
            notes: `Deposit via NOWPayments - finished (payment_id: ${callback.payment_id})`,
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

        // Unlock the previously locked balance
        if (pendingAmount > 0) {
          const { error: unlockError } = await supabase.rpc(
            'unlock_user_balance',
            {
              p_user_id: userId,
              p_base_token_id: baseTokenId,
              p_amount: pendingAmount,
            }
          );

          if (unlockError) {
            console.error('❌ Failed to unlock balance:', unlockError);
          } else {
            console.log('🔓 Balance unlocked - deposit confirmed');
          }
        }
      } else {
        // Create new completed transaction (skipped confirmed state)
        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            base_token_id: baseTokenId,
            network_id: networkId,
            token_deployment_id: depositAddress.token_deployment_id,
            type: 'deposit',
            amount: amountStr,
            coin_symbol: deploymentSymbol,
            status: 'completed',
            tx_hash: txHash,
            to_address: depositAddress.address,
            from_address: null,
            network_fee: '0',
            notes: `Deposit via NOWPayments - finished (payment_id: ${callback.payment_id})`,
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

        // Credit balance directly
        if (amount > 0) {
          const { error: creditError } = await supabase.rpc(
            'update_user_balance',
            {
              p_user_id: userId,
              p_base_token_id: baseTokenId,
              p_amount: amount,
              p_operation: 'credit',
            }
          );

          if (creditError) {
            console.error('❌ Failed to credit balance:', creditError);
            await supabase
              .from('transactions')
              .update({ status: 'failed', notes: 'Balance credit failed' })
              .eq('id', transaction.id);
            return NextResponse.json(
              { error: 'Failed to credit balance' },
              { status: 500 }
            );
          }

          console.log('✅ Balance credited directly (no prior pending state)');
        }
      }

      // Mark webhook as processed
      await supabase
        .from('webhook_logs')
        .update({ processed: true })
        .eq('payload->>payment_id', String(callback.payment_id));

      console.log('🎉 NOWPayments deposit completed successfully:', {
        payment_id: callback.payment_id,
        user: userId,
        base_token: baseTokenSymbol,
        network: network?.name,
        amount: amount,
        had_pending: !!existingTx,
      });

      // Send deposit confirmation email (non-blocking)
      try {
        const { data: user } = await supabase
          .from('profiles')
          .select('email, full_name, notification_preferences')
          .eq('id', userId)
          .single();

        if (user?.email) {
          const prefs = user.notification_preferences as {
            email_deposits?: boolean;
          } | null;
          const shouldSendEmail = prefs?.email_deposits !== false;

          if (shouldSendEmail) {
            const { data: balance } = await supabase
              .from('user_balances')
              .select('balance')
              .eq('user_id', userId)
              .eq('base_token_id', baseTokenId)
              .single();

            await sendDepositConfirmationEmail({
              email: user.email,
              recipientName: user.full_name || 'Valued Customer',
              amount: amountStr,
              coinSymbol: baseTokenSymbol || deploymentSymbol,
              txHash: `NOWPayments #${callback.payment_id}`,
              newBalance: balance?.balance,
            });
            console.log('📧 Deposit confirmation email sent');
          }
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send deposit email:', emailError);
      }

      return NextResponse.json({
        status: 'success',
        message: 'Deposit processed',
      });
    }

    // Other status - just acknowledge
    return NextResponse.json({ status: 'acknowledged' });
  } catch (error) {
    console.error('💥 NOWPayments webhook processing error:', error);
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
    message: 'NOWPayments webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

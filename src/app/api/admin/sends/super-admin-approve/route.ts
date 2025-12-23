/**
 * Super Admin Approve and Send API
 * Super Admin approves and actually sends the crypto via Plisio
 * Next.js 15 compatible
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { plisio } from '@/lib/plisio/client';
import { checkRateLimit, logRateLimitEvent, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { getPlisioCoinId } from '@/lib/plisio/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      user.id,
      'super_admin_approve',
      RATE_LIMITS.SUPER_ADMIN_APPROVE
    );

    if (!rateLimitResult.allowed) {
      await logRateLimitEvent({
        userId: user.id,
        action: 'super_admin_approve',
        allowed: false,
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the withdrawal request
    const { data: withdrawalRequest, error: wrError } = await supabase
      .from('withdrawal_requests')
      .select('*, profiles!withdrawal_requests_user_id_fkey(email, full_name), recipient:profiles!withdrawal_requests_recipient_user_id_fkey(email, full_name)')
      .eq('id', requestId)
      .single();

    if (wrError || !withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Super admin can approve from either 'pending' or 'admin_approved' status
    if (!['pending', 'admin_approved'].includes(withdrawalRequest.status)) {
      return NextResponse.json(
        { error: `Request cannot be approved from status: ${withdrawalRequest.status}` },
        { status: 400 }
      );
    }

    // Check if this is an internal transfer
    const isInternalTransfer = withdrawalRequest.is_internal_transfer || false;

    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', withdrawalRequest.transaction_id)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify transaction has base_token_id (new system)
    if (!transaction.base_token_id) {
      return NextResponse.json(
        { error: 'Transaction missing base_token_id - may need to re-create withdrawal request' },
        { status: 400 }
      );
    }

    // Check locked balance (balance was LOCKED when request was created, not deducted)
    const { data: balanceData, error: balanceError } = await supabase.rpc(
      'get_user_balance',
      {
        p_user_id: withdrawalRequest.user_id,
        p_base_token_id: transaction.base_token_id,
      }
    );

    if (balanceError) {
      console.error('Failed to get balance:', balanceError);
      return NextResponse.json({ error: 'Failed to check balance' }, { status: 500 });
    }

    const lockedBalance = parseFloat(balanceData.locked_balance || 0);
    const requestAmount = parseFloat(withdrawalRequest.amount);

    // Verify sufficient locked balance
    if (lockedBalance < requestAmount) {
      return NextResponse.json(
        { error: 'Insufficient locked balance for this withdrawal' },
        { status: 400 }
      );
    }

    let txHash = '';
    const sentAt = new Date().toISOString();

    // Handle internal transfer vs external withdrawal
    if (isInternalTransfer && withdrawalRequest.recipient_user_id) {
      console.log('💸 Processing internal transfer:', {
        from: withdrawalRequest.profiles.email,
        to: withdrawalRequest.recipient?.email,
        amount: withdrawalRequest.amount,
        coin: withdrawalRequest.coin_symbol,
      });

      // 1. Unlock and deduct from sender (was locked when request created)
      const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
        p_user_id: withdrawalRequest.user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: requestAmount,
        p_deduct: true, // Deduct from both balance and locked
      });

      if (unlockError) {
        console.error('Failed to unlock sender balance:', unlockError);
        return NextResponse.json(
          { error: 'Failed to process sender balance' },
          { status: 500 }
        );
      }

      // 2. Credit recipient balance
      const { error: creditError } = await supabase.rpc('update_user_balance', {
        p_user_id: withdrawalRequest.recipient_user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: requestAmount,
        p_operation: 'credit',
      });

      if (creditError) {
        console.error('Failed to credit recipient balance:', creditError);
        // Critical error - need to refund sender
        await supabase.rpc('update_user_balance', {
          p_user_id: withdrawalRequest.user_id,
          p_base_token_id: transaction.base_token_id,
          p_amount: requestAmount,
          p_operation: 'credit',
        });
        return NextResponse.json(
          { error: 'Failed to credit recipient balance' },
          { status: 500 }
        );
      }

      // 3. Create deposit transaction for recipient
      const { data: recipientTransaction, error: recipientTxError } = await supabase
        .from('transactions')
        .insert({
          user_id: withdrawalRequest.recipient_user_id,
          base_token_id: transaction.base_token_id,
          network_id: transaction.network_id,
          token_deployment_id: transaction.token_deployment_id,
          type: 'deposit',
          amount: withdrawalRequest.amount,
          coin_symbol: withdrawalRequest.coin_symbol,
          status: 'completed',
          to_address: withdrawalRequest.to_address,
          completed_at: sentAt,
          metadata: {
            internal_transfer: true,
            sender_user_id: withdrawalRequest.user_id,
            sender_transaction_id: transaction.id,
            sender_email: withdrawalRequest.profiles.email,
          },
        })
        .select()
        .single();

      if (recipientTxError) {
        console.error('Failed to create recipient transaction:', recipientTxError);
        // Don't fail the whole process - recipient received funds
      }

      txHash = `internal_transfer_${Date.now()}`;
      console.log('✅ Internal transfer completed:', {
        recipientEmail: withdrawalRequest.recipient?.email,
        recipientTransactionId: recipientTransaction?.id,
      });
    } else {
      // External withdrawal via Plisio
      // Get Plisio currency ID
      let psysCid: string;
      try {
        psysCid = getPlisioCoinId(withdrawalRequest.coin_symbol);
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Unsupported coin',
          },
          { status: 400 }
        );
      }

      // Send via Plisio
      console.log('🚀 Sending via Plisio:', {
        psysCid,
        to: withdrawalRequest.to_address,
        amount: withdrawalRequest.amount,
      });

      const withdrawalResult = await plisio.withdraw({
        psys_cid: psysCid,
        to: withdrawalRequest.to_address,
        amount: withdrawalRequest.amount,
        feePlan: 'normal',
      });

      if (withdrawalResult.status !== 'success') {
        console.error('❌ Plisio withdrawal failed:', withdrawalResult);

        // Unlock balance without deducting (refund to user)
        await supabase.rpc('unlock_user_balance', {
          p_user_id: withdrawalRequest.user_id,
          p_base_token_id: transaction.base_token_id,
          p_amount: requestAmount,
          p_deduct: false, // Just unlock, don't deduct
        });

        // Mark as failed
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'failed',
          })
          .eq('id', requestId);

        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            notes: `Failed to send via Plisio: ${JSON.stringify(withdrawalResult)}`,
          })
          .eq('id', transaction.id);

        return NextResponse.json({ error: 'Failed to send via Plisio' }, { status: 500 });
      }

      // Plisio withdrawal succeeded - unlock and deduct balance
      const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
        p_user_id: withdrawalRequest.user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: requestAmount,
        p_deduct: true, // Deduct from both balance and locked
      });

      if (unlockError) {
        console.error('Failed to unlock balance after withdrawal:', unlockError);
        // Plisio already sent - don't fail the whole process
        // Just log the error and continue
      }

      txHash = withdrawalResult.data.id || withdrawalResult.data.tx_url;
    }

    // Update withdrawal request - mark as super admin approved and sent
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        processing_type: 'automatic',
        super_admin_approved_by: user.id,
        super_admin_approved_at: sentAt,
        was_sent: true,
        sent_at: sentAt,
        // If admin didn't approve first, set admin fields too (super admin can skip admin step)
        admin_approved_by: withdrawalRequest.admin_approved_by || user.id,
        admin_approved_at: withdrawalRequest.admin_approved_at || sentAt,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update withdrawal request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request after send' },
        { status: 500 }
      );
    }

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        tx_hash: txHash,
        completed_at: sentAt,
        notes: isInternalTransfer
          ? `Internal transfer completed to ${withdrawalRequest.recipient?.email}`
          : 'Your withdrawal has been sent successfully',
        metadata: isInternalTransfer ? {
          internal_transfer: true,
          recipient_user_id: withdrawalRequest.recipient_user_id,
          recipient_email: withdrawalRequest.recipient?.email,
        } : undefined,
      })
      .eq('id', transaction.id);

    // Note: Balance was locked when request created, unlocked and deducted above

    console.log('✅ Send approved and processed by super admin:', {
      requestId,
      superAdminId: user.id,
      isInternalTransfer,
      txHash,
      amount: withdrawalRequest.amount,
      coin: withdrawalRequest.coin_symbol,
      sentAt,
    });

    // TODO: Send email notification to user about withdrawal completion
    // Template needed: WithdrawalApprovalEmail (already has function but needs proper template)
    // For internal transfers, also notify recipient
    // const { data: senderProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', withdrawalRequest.user_id)
    //   .single();
    // if (senderProfile) {
    //   await sendWithdrawalNotification({
    //     email: senderProfile.email,
    //     recipientName: senderProfile.full_name || 'User',
    //     amount: withdrawalRequest.amount,
    //     coinSymbol: withdrawalRequest.coin_symbol,
    //     address: withdrawalRequest.to_address,
    //     approved: true,
    //   });
    // }
    // 
    // If internal transfer, notify recipient
    // if (isInternalTransfer && withdrawalRequest.recipient_user_id) {
    //   const { data: recipientProfile } = await supabase
    //     .from('profiles')
    //     .select('email, full_name')
    //     .eq('id', withdrawalRequest.recipient_user_id)
    //     .single();
    //   if (recipientProfile) {
    //     await sendInternalTransferReceivedEmail({
    //       email: recipientProfile.email,
    //       recipientName: recipientProfile.full_name || 'User',
    //       amount: withdrawalRequest.amount,
    //       coinSymbol: withdrawalRequest.coin_symbol,
    //       senderEmail: senderProfile.email,
    //       senderName: senderProfile.full_name || 'User',
    //     });
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: 'Send approved and sent successfully',
      txHash,
      sentAt,
    });
  } catch (error) {
    console.error('Super admin approve send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve and send',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Mark Sent Manual API
 * Admin or Super Admin marks a withdrawal as sent manually (off-platform)
 * Next.js 15 compatible
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, logRateLimitEvent, RATE_LIMITS } from '@/lib/security/rate-limiter';

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

    // Check if user is admin or super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      user.id,
      'mark_sent_manual',
      RATE_LIMITS.MARK_SENT_MANUAL
    );

    if (!rateLimitResult.allowed) {
      await logRateLimitEvent({
        userId: user.id,
        action: 'mark_sent_manual',
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
    const { requestId, txHash } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the withdrawal request
    const { data: withdrawalRequest, error: wrError } = await supabase
      .from('withdrawal_requests')
      .select('*, profiles!withdrawal_requests_user_id_fkey(email, full_name)')
      .eq('id', requestId)
      .single();

    if (wrError || !withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Can mark as sent from pending or admin_approved status
    if (!['pending', 'admin_approved'].includes(withdrawalRequest.status)) {
      return NextResponse.json(
        { error: `Request cannot be marked as sent from status: ${withdrawalRequest.status}` },
        { status: 400 }
      );
    }

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

    const sentAt = new Date().toISOString();
    const originalStatus = withdrawalRequest.status; // Store for rollback if needed

    // Update withdrawal request - mark as manually sent
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        processing_type: 'manual',
        super_admin_approved_by: user.id,
        super_admin_approved_at: sentAt,
        was_sent: true,
        sent_at: sentAt,
        // If admin didn't approve first, set admin fields too
        admin_approved_by: withdrawalRequest.admin_approved_by || user.id,
        admin_approved_at: withdrawalRequest.admin_approved_at || sentAt,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update withdrawal request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        tx_hash: txHash || null,
        completed_at: sentAt,
        // notes: withdrawalRequest.is_internal_transfer
        //   ? `Internal transfer completed to ${withdrawalRequest.profiles.email}`
        //   : 'Your withdrawal has been processed',
      })
      .eq('id', transaction.id);

    // If it's an internal transfer, process balance transfers and create recipient transaction
    if (withdrawalRequest.is_internal_transfer && withdrawalRequest.recipient_user_id) {
      // Unlock sender's balance and deduct (balance was locked when request was created)
      const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
        p_user_id: withdrawalRequest.user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: parseFloat(withdrawalRequest.amount),
        p_deduct: true, // Deduct from sender
      });

      if (unlockError) {
        console.error('Failed to unlock sender balance:', unlockError);
        return NextResponse.json(
          { error: 'Failed to process sender balance' },
          { status: 500 }
        );
      }

      // Credit recipient's balance
      const { error: creditError } = await supabase.rpc('update_user_balance', {
        p_user_id: withdrawalRequest.recipient_user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: parseFloat(withdrawalRequest.amount),
        p_operation: 'credit',
      });

      if (creditError) {
        console.error('Failed to credit recipient balance:', creditError);

        // ROLLBACK: Refund sender by re-crediting their balance
        // (balance was already unlocked and deducted above)
        await supabase.rpc('update_user_balance', {
          p_user_id: withdrawalRequest.user_id,
          p_base_token_id: transaction.base_token_id,
          p_amount: parseFloat(withdrawalRequest.amount),
          p_operation: 'credit', // Refund
        });

        // Revert withdrawal_request status back to original
        await supabase
          .from('withdrawal_requests')
          .update({ status: originalStatus })
          .eq('id', requestId);

        return NextResponse.json(
          { error: 'Failed to credit recipient balance. Transaction rolled back.' },
          { status: 500 }
        );
      }

      // Create deposit transaction for recipient (using new unified balance schema)
      await supabase
        .from('transactions')
        .insert({
          user_id: withdrawalRequest.recipient_user_id,
          base_token_id: transaction.base_token_id,
          network_id: transaction.network_id,
          token_deployment_id: transaction.token_deployment_id,
          type: 'deposit',
          amount: withdrawalRequest.amount,
          coin_symbol: withdrawalRequest.coin_symbol, // Keep for backward compatibility
          status: 'completed',
          from_address: 'internal',
          completed_at: sentAt,
          metadata: {
            internal_transfer: true,
            sender_user_id: withdrawalRequest.user_id,
            sender_transaction_id: transaction.id,
            sender_email: withdrawalRequest.profiles.email,
          },
        });
    } else {
      // External withdrawal - unlock and deduct sender's balance
      // (balance was locked when request was created)
      const { error: unlockError } = await supabase.rpc('unlock_user_balance', {
        p_user_id: withdrawalRequest.user_id,
        p_base_token_id: transaction.base_token_id,
        p_amount: parseFloat(withdrawalRequest.amount),
        p_deduct: true, // Deduct from both balance and locked
      });

      if (unlockError) {
        console.error('Failed to unlock sender balance:', unlockError);

        // Revert withdrawal_request status since balance operation failed
        await supabase
          .from('withdrawal_requests')
          .update({ status: originalStatus })
          .eq('id', requestId);

        return NextResponse.json(
          { error: 'Failed to process balance for external withdrawal' },
          { status: 500 }
        );
      }
    }

    console.log('✅ Send marked as sent manually:', {
      requestId,
      adminId: user.id,
      adminRole: profile.role,
      amount: withdrawalRequest.amount,
      coin: withdrawalRequest.coin_symbol,
      sentAt,
      txHash,
    });

    // TODO: Send email notification to user

    return NextResponse.json({
      success: true,
      message: 'Withdrawal marked as sent successfully',
      sentAt,
    });
  } catch (error) {
    console.error('Mark sent manual error:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark as sent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

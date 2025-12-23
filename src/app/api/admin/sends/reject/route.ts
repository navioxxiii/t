/**
 * Reject Send API
 * Reject a pending send request with reason
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      user.id,
      'reject',
      RATE_LIMITS.REJECT
    );

    if (!rateLimitResult.allowed) {
      await logRateLimitEvent({
        userId: user.id,
        action: 'reject',
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
    const { requestId, reason } = body;

    if (!requestId || !reason) {
      return NextResponse.json(
        { error: 'Request ID and reason are required' },
        { status: 400 }
      );
    }

    // Get the withdrawal request
    const { data: withdrawalRequest, error: wrError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (wrError || !withdrawalRequest) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    if (!['pending', 'admin_approved'].includes(withdrawalRequest.status)) {
      return NextResponse.json({ error: 'Request cannot be rejected from current status' }, { status: 400 });
    }

    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('base_token_id')
      .eq('id', withdrawalRequest.transaction_id)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify transaction has base_token_id
    if (!transaction.base_token_id) {
      return NextResponse.json(
        { error: 'Transaction missing base_token_id - may need to re-create withdrawal request' },
        { status: 400 }
      );
    }

    // Unlock the balance without deducting (refund to user - balance was locked when request created)
    const { error: balanceError } = await supabase.rpc('unlock_user_balance', {
      p_user_id: withdrawalRequest.user_id,
      p_base_token_id: transaction.base_token_id,
      p_amount: parseFloat(withdrawalRequest.amount),
      p_deduct: false, // Just unlock, don't deduct (returns funds to available balance)
    });

    if (balanceError) {
      console.error('Failed to unlock balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to unlock balance' },
        { status: 500 }
      );
    }

    // Update withdrawal request
    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Update transaction with user-friendly message
    await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        notes: `Your withdrawal was declined: ${reason}`,
      })
      .eq('id', withdrawalRequest.transaction_id);

    console.log('✅ Send rejected:', {
      requestId,
      reason,
    });

    // TODO: Send email notification to user about withdrawal rejection
    // Template needed: WithdrawalRejectionEmail (already has function but needs proper template)
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', withdrawalRequest.user_id)
    //   .single();
    // if (userProfile) {
    //   await sendWithdrawalNotification({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     amount: withdrawalRequest.amount,
    //     coinSymbol: withdrawalRequest.coin_symbol,
    //     address: withdrawalRequest.to_address,
    //     approved: false,
    //     rejectionReason: reason,
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: 'Send request rejected',
    });
  } catch (error) {
    console.error('Reject send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject send',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

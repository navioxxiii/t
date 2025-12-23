/**
 * Admin Approve Send API
 * Admin reviews and approves the transaction (but doesn't send it)
 * Only Super Admins can actually send the crypto
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

    // Check if user is admin (not super_admin)
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
      'admin_approve',
      RATE_LIMITS.ADMIN_APPROVE
    );

    if (!rateLimitResult.allowed) {
      await logRateLimitEvent({
        userId: user.id,
        action: 'admin_approve',
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
      .select('*, profiles!withdrawal_requests_user_id_fkey(email, full_name)')
      .eq('id', requestId)
      .single();

    if (wrError || !withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (withdrawalRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is not pending' },
        { status: 400 }
      );
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

    // Check locked balance (balance should be locked at this point)
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

    // Update withdrawal request - mark as admin approved
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'admin_approved',
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update withdrawal request:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve request' },
        { status: 500 }
      );
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'pending',
        // Add notes for user, if needed, visible to user
        notes: '',
      })
      .eq('id', withdrawalRequest.transaction_id);

    console.log('✅ Send approved by admin:', {
      requestId,
      adminId: user.id,
      amount: withdrawalRequest.amount,
      coin: withdrawalRequest.coin_symbol,
      status: 'admin_approved',
    });

    // TODO: Send email notification to user about admin approval (awaiting super admin)
    // Template needed: WithdrawalAdminApprovedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', withdrawalRequest.user_id)
    //   .single();
    // if (userProfile) {
    //   await sendWithdrawalAdminApprovedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     amount: withdrawalRequest.amount,
    //     coinSymbol: withdrawalRequest.coin_symbol,
    //     address: withdrawalRequest.to_address,
    //   });
    // }
    //
    // TODO: Send notification to super admins about pending approval
    // Template needed: AdminNotificationEmail (for super admins)
    // const { data: superAdmins } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('role', 'super_admin');
    // if (superAdmins) {
    //   for (const admin of superAdmins) {
    //     await sendAdminNotificationEmail({
    //       email: admin.email,
    //       recipientName: admin.full_name || 'Admin',
    //       notificationType: 'withdrawal_pending_super_admin',
    //       message: `Withdrawal request ${requestId} approved by admin, awaiting super admin approval`,
    //       actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/sends`,
    //     });
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: 'Send approved by admin. Awaiting super admin approval to send.',
      status: 'admin_approved',
    });
  } catch (error) {
    console.error('Admin approve send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve send',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

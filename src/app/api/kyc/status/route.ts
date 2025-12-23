import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile with KYC status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_tier, kyc_verified_at, kyc_rejection_reason')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch KYC status' },
        { status: 500 }
      );
    }

    // Get latest KYC submission if exists
    const { data: submission, error: submissionError } = await supabase
      .from('kyc_submissions')
      .select('id, requested_tier, status, created_at, reviewed_at, rejection_reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // It's okay if there's no submission
    if (submissionError && submissionError.code !== 'PGRST116') {
      console.error('Error fetching submission:', submissionError);
    }

    // Get transaction limits for user's tier
    const tier = profile.kyc_tier || 'none';
    const { data: limits, error: limitsError } = await supabase
      .from('kyc_transaction_limits')
      .select('*')
      .eq('tier', tier)
      .single();

    if (limitsError) {
      console.error('Error fetching limits:', limitsError);
    }

    // Get today's transaction total
    const { data: todayTotal, error: totalError } = await supabase
      .from('user_transaction_totals')
      .select('daily_total_usd')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    // It's okay if there's no total yet (no transactions today)
    const dailySpent = todayTotal?.daily_total_usd || 0;
    const dailyLimit = limits?.daily_limit_usd || 0;
    const remainingLimit = Math.max(dailyLimit - dailySpent, 0);

    return NextResponse.json({
      kyc_status: profile.kyc_status,
      kyc_tier: profile.kyc_tier,
      kyc_verified_at: profile.kyc_verified_at,
      kyc_rejection_reason: profile.kyc_rejection_reason,
      latest_submission: submission || null,
      limits: limits
        ? {
            tier,
            daily_limit_usd: limits.daily_limit_usd,
            monthly_limit_usd: limits.monthly_limit_usd,
            single_transaction_limit_usd: limits.single_transaction_limit_usd,
            daily_spent_usd: dailySpent,
            remaining_daily_limit_usd: remainingLimit,
            can_deposit: limits.can_deposit,
            can_withdraw: limits.can_withdraw,
            can_swap: limits.can_swap,
            can_send: limits.can_send,
            can_earn: limits.can_earn,
            can_copy_trade: limits.can_copy_trade,
          }
        : null,
    });
  } catch (error) {
    console.error('KYC status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

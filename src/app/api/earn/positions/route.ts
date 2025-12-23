/**
 * GET /api/earn/positions
 * Fetch user's earn positions with real-time profit calculations
 * Returns active, matured, and withdrawn positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EARN_ENABLED } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!EARN_ENABLED) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's positions with vault details
    const { data: positions, error: positionsError } = await supabase
      .from('user_earn_positions')
      .select(`
        *,
        vault:earn_vaults(*)
      `)
      .eq('user_id', user.id)
      .order('invested_at', { ascending: false });

    if (positionsError) {
      console.error('Failed to fetch positions:', positionsError);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Calculate current profit for each position
    const now = new Date();
    const positionsWithProfit = positions?.map((position) => {
      const investedAt = new Date(position.invested_at);
      const maturesAt = new Date(position.matures_at);

      // Calculate days elapsed
      const msElapsed = now.getTime() - investedAt.getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

      // Calculate total duration in days
      const totalDuration = (maturesAt.getTime() - investedAt.getTime()) / (1000 * 60 * 60 * 24);

      // Calculate current accumulated profit
      // For active positions: based on days elapsed (capped at maturity)
      // For matured/withdrawn: use total profit
      let currentProfit = 0;
      if (position.status === 'active') {
        const effectiveDays = Math.min(daysElapsed, totalDuration);
        currentProfit = Number(position.daily_profit_rate) * effectiveDays;
        // Cap at total profit to prevent overflow
        currentProfit = Math.min(currentProfit, Number(position.total_profit_usdt));
      } else {
        currentProfit = Number(position.total_profit_usdt);
      }

      // Calculate time remaining for active positions
      const msRemaining = maturesAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const hoursRemaining = Math.max(0, Math.ceil((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

      // Progress percentage
      const progressPercentage = Math.min(100, (daysElapsed / totalDuration) * 100);

      return {
        ...position,
        calculated: {
          current_profit: currentProfit,
          days_elapsed: Math.floor(daysElapsed),
          days_remaining: daysRemaining,
          hours_remaining: hoursRemaining,
          progress_percentage: progressPercentage,
          is_matured: now >= maturesAt,
        },
      };
    }) || [];

    // Group positions by status
    const active = positionsWithProfit.filter((p) => p.status === 'active');
    const matured = positionsWithProfit.filter((p) => p.status === 'matured');
    const withdrawn = positionsWithProfit.filter((p) => p.status === 'withdrawn');

    // Calculate totals
    const totalInvested = active.reduce((sum, p) => sum + Number(p.amount_usdt), 0);
    const totalCurrentProfit = active.reduce((sum, p) => sum + p.calculated.current_profit, 0);
    const totalLifetimeEarnings = withdrawn.reduce((sum, p) => sum + Number(p.total_profit_usdt), 0);

    return NextResponse.json({
      positions: positionsWithProfit,
      grouped: {
        active,
        matured,
        withdrawn,
      },
      summary: {
        total_active_positions: active.length,
        total_invested: totalInvested,
        total_current_profit: totalCurrentProfit,
        total_matured_positions: matured.length,
        total_lifetime_earnings: totalLifetimeEarnings,
      },
    });

  } catch (error) {
    console.error('Earn positions API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

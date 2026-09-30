/**
 * GET /api/earn/positions
 * Fetch user's earn positions with real-time profit calculations
 * Returns active, matured, and withdrawn positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EARN_ENABLED } from '@/lib/feature-flags';
import { calcAccruedProfit, getPositionProgress } from '@/lib/earn/calc';

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

    // Normalize numeric columns and attach live calculations
    const now = Date.now();
    const positionsWithProfit = (positions || []).map((position) => {
      const normalized = {
        ...position,
        amount_usdt: Number(position.amount_usdt),
        daily_profit_rate: Number(position.daily_profit_rate),
        total_profit_usdt: Number(position.total_profit_usdt),
        vault: position.vault && {
          ...position.vault,
          apy_percent: Number(position.vault.apy_percent),
          duration_months: Number(position.vault.duration_months),
        },
      };
      const progress = getPositionProgress(normalized, now);

      return {
        ...normalized,
        calculated: {
          ...progress,
          current_profit:
            normalized.status === 'active'
              ? calcAccruedProfit(normalized, now)
              : normalized.total_profit_usdt,
        },
      };
    });

    // Active positions past maturity are claimable even before the cron marks them
    const active = positionsWithProfit.filter(
      (p) => p.status === 'active' && !p.calculated.is_matured
    );
    const matured = positionsWithProfit.filter(
      (p) => p.status === 'matured' || (p.status === 'active' && p.calculated.is_matured)
    );
    const withdrawn = positionsWithProfit.filter((p) => p.status === 'withdrawn');

    // Calculate totals
    const totalInvested = active.reduce((sum, p) => sum + p.amount_usdt, 0);
    const totalCurrentProfit = active.reduce((sum, p) => sum + p.calculated.current_profit, 0);
    const totalClaimable = matured.reduce((sum, p) => sum + p.amount_usdt + p.total_profit_usdt, 0);
    const totalLifetimeEarnings = withdrawn.reduce((sum, p) => sum + p.total_profit_usdt, 0);

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
        total_value: totalInvested + totalCurrentProfit + totalClaimable,
        total_claimable: totalClaimable,
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

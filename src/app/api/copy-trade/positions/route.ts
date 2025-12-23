/**
 * GET /api/copy-trade/positions
 * Get user's copy trading positions (active, stopped, liquidated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COPY_TRADE_ENABLED } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!COPY_TRADE_ENABLED) {
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

    // Fetch all user positions with trader details
    const { data: positions, error: positionsError } = await supabase
      .from('user_copy_positions')
      .select(`
        *,
        trader:traders(*)
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (positionsError) {
      console.error('Failed to fetch positions:', positionsError);
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    // Group positions by status
    const activePositions = positions.filter((p) => p.status === 'active');
    const stoppedPositions = positions.filter((p) => p.status === 'stopped');
    const liquidatedPositions = positions.filter((p) => p.status === 'liquidated');

    // Calculate summary stats
    const totalActivePositions = activePositions.length;
    const totalInvested = activePositions.reduce(
      (sum, p) => sum + Number(p.allocation_usdt),
      0
    );
    const totalCurrentPnl = activePositions.reduce(
      (sum, p) => sum + Number(p.current_pnl),
      0
    );
    const totalLifetimeProfit = stoppedPositions.reduce(
      (sum, p) => sum + Number(p.final_pnl || 0),
      0
    );

    return NextResponse.json({
      success: true,
      grouped: {
        active: activePositions,
        stopped: stoppedPositions,
        liquidated: liquidatedPositions,
      },
      summary: {
        total_active_positions: totalActivePositions,
        total_invested: totalInvested,
        total_current_pnl: totalCurrentPnl,
        total_lifetime_profit: totalLifetimeProfit,
      },
    });
  } catch (error) {
    console.error('Copy-trade positions API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

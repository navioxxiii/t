/**
 * GET /api/copy-trade/traders
 * List all traders with live stats and availability
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

    // Get authenticated user (optional - for isUserCopying flag)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get all traders
    const { data: traders, error: tradersError } = await supabase
      .from('traders')
      .select('*')
      .order('aum_usdt', { ascending: false });

    if (tradersError) {
      console.error('Failed to fetch traders:', tradersError);
      return NextResponse.json(
        { error: 'Failed to fetch traders' },
        { status: 500 }
      );
    }

    // Get user's active positions (if authenticated)
    let userActiveTraderIds: string[] = [];
    let userWaitlistTraderIds: string[] = [];
    if (user) {
      const { data: userPositions } = await supabase
        .from('user_copy_positions')
        .select('trader_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (userPositions) {
        userActiveTraderIds = userPositions.map((p) => p.trader_id);
      }

      // Get user's waitlist entries
      const { data: waitlistEntries } = await supabase
        .from('trader_waitlist')
        .select('trader_id')
        .eq('user_id', user.id)
        .in('status', ['waiting', 'notified']);

      if (waitlistEntries) {
        userWaitlistTraderIds = waitlistEntries.map((e) => e.trader_id);
      }
    }

    // Calculate availability for each trader and add user flags
    const tradersWithAvailability = traders.map((trader) => {
      const currentCopiers = Number(trader.current_copiers) || 0;
      const maxCopiers = Number(trader.max_copiers);
      const isFull = currentCopiers >= maxCopiers;
      const fillPercentage = (currentCopiers / maxCopiers) * 100;
      const remainingCapacity = maxCopiers - currentCopiers;
      const isUserCopying = userActiveTraderIds.includes(trader.id);
      const isUserOnWaitlist = userWaitlistTraderIds.includes(trader.id);

      return {
        ...trader,
        availability: {
          isFull,
          fillPercentage,
          remainingCapacity,
        },
        isUserCopying,
        isUserOnWaitlist,
      };
    });

    return NextResponse.json({
      success: true,
      traders: tradersWithAvailability,
    });
  } catch (error) {
    console.error('Copy-trade traders API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/copy-trade/waitlist/join
 * Join waitlist when trader is full
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { COPY_TRADE_ENABLED } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
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

    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { traderId } = body;

    if (!traderId) {
      return NextResponse.json(
        { error: 'Missing trader ID' },
        { status: 400 }
      );
    }

    // Fetch trader
    const { data: trader, error: traderError } = await adminClient
      .from('traders')
      .select('*')
      .eq('id', traderId)
      .single();

    if (traderError || !trader) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Check if trader is actually full
    const currentCopiers = Number(trader.current_copiers);
    const maxCopiers = Number(trader.max_copiers);

    if (currentCopiers < maxCopiers) {
      return NextResponse.json(
        { error: 'Trader has available capacity. Start copying directly.' },
        { status: 400 }
      );
    }

    // Check if already in waitlist
    const { data: existingEntry } = await adminClient
      .from('trader_waitlist')
      .select('id, status, position_in_queue')
      .eq('user_id', user.id)
      .eq('trader_id', traderId)
      .in('status', ['waiting', 'notified'])
      .single();

    if (existingEntry) {
      return NextResponse.json(
        {
          error: 'Already in waitlist',
          position: existingEntry.position_in_queue,
        },
        { status: 400 }
      );
    }

    // Check if already copying this trader
    const { data: existingPosition } = await adminClient
      .from('user_copy_positions')
      .select('id')
      .eq('user_id', user.id)
      .eq('trader_id', traderId)
      .eq('status', 'active')
      .single();

    if (existingPosition) {
      return NextResponse.json(
        { error: 'You are already copying this trader' },
        { status: 400 }
      );
    }

    // Calculate position in queue
    const { count } = await adminClient
      .from('trader_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('trader_id', traderId)
      .eq('status', 'waiting');

    const positionInQueue = (count || 0) + 1;

    // Add to waitlist
    const { data: waitlistEntry, error: waitlistError } = await adminClient
      .from('trader_waitlist')
      .insert({
        user_id: user.id,
        trader_id: traderId,
        status: 'waiting',
        position_in_queue: positionInQueue,
      })
      .select()
      .single();

    if (waitlistError) {
      console.error('Failed to join waitlist:', waitlistError);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      waitlist_entry: waitlistEntry,
      position: positionInQueue,
      message: `You're #${positionInQueue} in line for ${trader.name}`,
    });
  } catch (error) {
    console.error('Waitlist join API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

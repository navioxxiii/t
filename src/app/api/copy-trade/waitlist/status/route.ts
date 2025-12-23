/**
 * GET /api/copy-trade/waitlist/status
 * Get user's current waitlist entries
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

    // Fetch user's waitlist entries with trader details
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from('trader_waitlist')
      .select(`
        *,
        trader:traders(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['waiting', 'notified'])
      .order('created_at', { ascending: true });

    if (waitlistError) {
      console.error('Failed to fetch waitlist status:', waitlistError);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      waitlist_entries: waitlistEntries || [],
    });
  } catch (error) {
    console.error('Waitlist status API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

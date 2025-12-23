/**
 * POST /api/copy-trade/waitlist/leave
 * Leave waitlist for a trader
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

    // Delete waitlist entry
    const { error: deleteError } = await adminClient
      .from('trader_waitlist')
      .delete()
      .eq('user_id', user.id)
      .eq('trader_id', traderId)
      .in('status', ['waiting', 'notified']);

    if (deleteError) {
      console.error('Failed to leave waitlist:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left waitlist',
    });
  } catch (error) {
    console.error('Waitlist leave API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

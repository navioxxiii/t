/**
 * GET/POST /api/earn/mature-cron
 * Daily cron job - marks positions as matured when matures_at is reached
 * Runs every day at midnight UTC via Vercel Cron
 * Does NOT credit wallets - only updates status to 'matured'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EARN_ENABLED } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  return handleMatureCron(request);
}

export async function POST(request: NextRequest) {
  return handleMatureCron(request);
}

async function handleMatureCron(request: NextRequest) {
  try {
    // Feature flag check
    if (!EARN_ENABLED) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    // Verify cron authorization (Vercel Cron sends special header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // If CRON_SECRET is set, validate it
      // In development, allow running without secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find all active positions that have reached maturity
    const { data: maturedPositions, error: fetchError } = await supabase
      .from('user_earn_positions')
      .select('id, user_id, vault_id, amount_usdt, total_profit_usdt, matures_at')
      .eq('status', 'active')
      .lte('matures_at', now);

    if (fetchError) {
      console.error('Failed to fetch matured positions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch matured positions' },
        { status: 500 }
      );
    }

    if (!maturedPositions || maturedPositions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No positions to mature',
        matured_count: 0,
      });
    }

    // Update all matured positions to status 'matured'
    const positionIds = maturedPositions.map((p) => p.id);

    const { error: updateError } = await supabase
      .from('user_earn_positions')
      .update({ status: 'matured' })
      .in('id', positionIds);

    if (updateError) {
      console.error('Failed to update positions to matured:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark positions as matured' },
        { status: 500 }
      );
    }

    // Log the cron execution
    console.log(`[Earn Cron] Matured ${maturedPositions.length} positions at ${now}`);

    return NextResponse.json({
      success: true,
      message: `Successfully matured ${maturedPositions.length} positions`,
      matured_count: maturedPositions.length,
      matured_positions: maturedPositions.map((p) => ({
        id: p.id,
        amount: p.amount_usdt,
        profit: p.total_profit_usdt,
        matured_at: p.matures_at,
      })),
      timestamp: now,
    });

  } catch (error) {
    console.error('Earn mature cron API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

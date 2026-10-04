/**
 * GET /api/staking/daily-cron
 * Daily job (cron-job.org, Authorization: Bearer CRON_SECRET):
 * 1. Distribute recorded reward batches pro-rata to stakers (minus commission)
 * 2. Release stakes whose unbonding period has ended
 * Safe to re-run: rewards are recorded per batch + position before crediting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron/auth';
import { distributePendingBatches, releaseUnbonded } from '@/lib/staking/service';
import { stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function GET(request: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;
  try {
    const batches = await distributePendingBatches();
    const released = await releaseUnbonded();
    return NextResponse.json({ success: true, batches, released, timestamp: new Date().toISOString() });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

export const POST = GET;

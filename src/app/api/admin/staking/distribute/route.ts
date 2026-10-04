/**
 * POST /api/admin/staking/distribute - run the daily staking job now (super_admin only)
 * Same work as /api/staking/daily-cron; safe to run repeatedly.
 */

import { NextResponse } from 'next/server';
import { distributePendingBatches, releaseUnbonded } from '@/lib/staking/service';
import { requireStakingAdmin, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function POST() {
  const guard = await requireStakingAdmin();
  if (!guard.ok) return guard.response;
  if (guard.value.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can distribute staking rewards' }, { status: 403 });
  }
  try {
    const batches = await distributePendingBatches();
    const released = await releaseUnbonded();
    return NextResponse.json({ success: true, batches, released });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

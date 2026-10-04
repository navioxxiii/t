/**
 * GET /api/staking/positions - the signed-in user's stakes
 */

import { NextResponse } from 'next/server';
import { listUserPositions } from '@/lib/staking/service';
import { requireStakingUser, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function GET() {
  const guard = await requireStakingUser();
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json({ positions: await listUserPositions(guard.value.id) });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

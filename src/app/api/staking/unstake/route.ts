/**
 * POST /api/staking/unstake { positionId } - starts the coin's unbonding period
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstake } from '@/lib/staking/service';
import { requireStakingUser, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function POST(request: NextRequest) {
  const guard = await requireStakingUser();
  if (!guard.ok) return guard.response;
  try {
    const { positionId } = await request.json();
    if (!positionId) return NextResponse.json({ error: 'Missing positionId' }, { status: 400 });
    return NextResponse.json({ success: true, ...(await unstake(guard.value.id, String(positionId))) });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

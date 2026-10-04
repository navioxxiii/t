/**
 * POST /api/staking/stake { baseTokenId, amount }
 */

import { NextRequest, NextResponse } from 'next/server';
import { stake } from '@/lib/staking/service';
import { requireStakingUser, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function POST(request: NextRequest) {
  const guard = await requireStakingUser();
  if (!guard.ok) return guard.response;
  try {
    const { baseTokenId, amount } = await request.json();
    const position = await stake(guard.value.id, Number(baseTokenId), parseFloat(amount));
    return NextResponse.json({ success: true, position });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

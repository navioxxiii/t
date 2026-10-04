/**
 * GET /api/staking/assets - coins available for staking, with terms and APY
 */

import { NextResponse } from 'next/server';
import { listAssets } from '@/lib/staking/service';
import { requireStakingUser, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function GET() {
  const guard = await requireStakingUser();
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json({ assets: await listAssets() });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

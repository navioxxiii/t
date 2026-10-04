/**
 * GET  /api/admin/staking/rewards - recent reward batches
 * POST /api/admin/staking/rewards - record rewards actually received (super_admin only)
 *   { baseTokenId, rewardDate: 'YYYY-MM-DD', grossAmount, notes? }
 *   The daily job distributes them to stakers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordRewardBatch } from '@/lib/staking/service';
import { requireStakingAdmin, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function GET() {
  const guard = await requireStakingAdmin();
  if (!guard.ok) return guard.response;
  const { data, error } = await createAdminClient()
    .from('staking_reward_batches')
    .select('*, token:base_tokens(symbol, name, logo_url)')
    .order('reward_date', { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: 'Failed to load reward batches' }, { status: 500 });
  return NextResponse.json({ batches: data ?? [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireStakingAdmin();
  if (!guard.ok) return guard.response;
  if (guard.value.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can record staking rewards' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const batch = await recordRewardBatch({
      baseTokenId: Number(body.baseTokenId),
      rewardDate: String(body.rewardDate ?? ''),
      grossAmount: parseFloat(body.grossAmount),
      notes: body.notes ? String(body.notes).slice(0, 500) : undefined,
      recordedBy: guard.value.id,
    });
    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

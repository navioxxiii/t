/**
 * GET /api/admin/staking/assets - all staking coins (incl. disabled) with pool totals,
 *   plus active base tokens not yet set up
 * PUT /api/admin/staking/assets - create or update a coin's staking terms (super_admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAssets, StakingError } from '@/lib/staking/service';
import { requireStakingAdmin, stakingErrorResponse } from '@/lib/staking/route-helpers';

export async function GET() {
  const guard = await requireStakingAdmin();
  if (!guard.ok) return guard.response;
  try {
    const assets = await listAssets({ includeDisabled: true, withTotals: true });
    const configured = new Set(assets.map((a) => a.base_token_id));
    const { data: tokens } = await createAdminClient()
      .from('base_tokens')
      .select('id, symbol, name, logo_url, is_stablecoin')
      .eq('is_active', true)
      .order('symbol');
    return NextResponse.json({
      assets,
      available_tokens: (tokens ?? []).filter((t) => !configured.has(t.id) && !t.is_stablecoin),
    });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireStakingAdmin();
  if (!guard.ok) return guard.response;
  if (guard.value.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can change staking terms' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const baseTokenId = Number(body.baseTokenId);
    const minStake = Number(body.min_stake ?? 0);
    const unbondingDays = Number(body.unbonding_days ?? 0);
    const commission = Number(body.commission_percent ?? 0);
    const estimatedApy = body.estimated_apy === null || body.estimated_apy === '' || body.estimated_apy === undefined
      ? null
      : Number(body.estimated_apy);

    if (!Number.isInteger(baseTokenId) || baseTokenId <= 0) throw new StakingError('Invalid coin');
    if (!isFinite(minStake) || minStake < 0) throw new StakingError('Minimum stake must be 0 or more');
    if (!Number.isInteger(unbondingDays) || unbondingDays < 0 || unbondingDays > 365) throw new StakingError('Unbonding days must be 0-365');
    if (!isFinite(commission) || commission < 0 || commission >= 100) throw new StakingError('Commission must be between 0 and 100');
    if (estimatedApy !== null && (!isFinite(estimatedApy) || estimatedApy < 0 || estimatedApy > 100)) throw new StakingError('Estimated APY must be 0-100');

    const { data, error } = await createAdminClient()
      .from('staking_assets')
      .upsert(
        {
          base_token_id: baseTokenId,
          enabled: Boolean(body.enabled),
          min_stake: minStake,
          unbonding_days: unbondingDays,
          commission_percent: commission,
          estimated_apy: estimatedApy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'base_token_id' }
      )
      .select()
      .single();
    if (error) throw new StakingError('Failed to save staking terms', 500);
    return NextResponse.json({ success: true, asset: data });
  } catch (error) {
    return stakingErrorResponse(error);
  }
}

/**
 * Staking service - all staking logic, used by the API routes and the daily job.
 *
 * Model: users stake PoS coins into a platform pool; ops stake the pool; admins record
 * the rewards actually received per coin per day; the daily job shares them out pro-rata
 * (minus commission) and releases finished unbonding. Every balance move goes through the
 * existing update_user_balance RPC, ordered so a failure can't pay or debit twice.
 *
 * Server-only: uses the service-role client.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { StakingAsset, StakingPosition, StakingRewardBatch } from '@/types/staking';

type Admin = ReturnType<typeof createAdminClient>;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Shares are rounded down so a batch can never pay out more than was received */
const SHARE_DECIMALS = 8;
const APY_WINDOW_DAYS = 30;
/** Realized APY is shown only once there's at least this many reward days in the window */
const MIN_APY_HISTORY_DAYS = 7;

export class StakingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const TOKEN_SELECT = 'token:base_tokens(id, symbol, name, logo_url, is_stablecoin)';

function floorTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

async function changeBalance(admin: Admin, userId: string, baseTokenId: number, amount: number, operation: 'credit' | 'debit') {
  const { error } = await admin.rpc('update_user_balance', {
    p_user_id: userId,
    p_base_token_id: baseTokenId,
    p_amount: amount,
    p_operation: operation,
  });
  if (error) throw new StakingError(`Balance ${operation} failed: ${error.message}`, 500);
}

async function recordTransaction(
  admin: Admin,
  userId: string,
  baseTokenId: number,
  symbol: string,
  type: 'staking_stake' | 'staking_unstake' | 'staking_reward' | 'staking_release',
  amount: number,
  metadata: Record<string, unknown>
) {
  const { error } = await admin.from('transactions').insert({
    user_id: userId,
    base_token_id: baseTokenId,
    type,
    coin_symbol: symbol,
    amount: amount.toString(),
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata,
  });
  // Balances already moved - log for review rather than failing the user's action
  if (error) console.error(`[staking] Failed to record ${type} transaction:`, error);
}

// ─── Assets ───

/** Stakeable coins with their APY: trailing realized APY when available, else the admin estimate */
export async function listAssets(options: { includeDisabled?: boolean; withTotals?: boolean } = {}): Promise<StakingAsset[]> {
  const admin = createAdminClient();
  let query = admin.from('staking_assets').select(`*, ${TOKEN_SELECT}`).order('created_at');
  if (!options.includeDisabled) query = query.eq('enabled', true);
  const { data: assets, error } = await query;
  if (error) throw new StakingError('Failed to load staking assets', 500);

  const sinceDate = new Date(Date.now() - APY_WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
  const [{ data: batches }, { data: active }] = await Promise.all([
    admin
      .from('staking_reward_batches')
      .select('base_token_id, reward_date, distributed_amount')
      .eq('status', 'distributed')
      .gte('reward_date', sinceDate),
    admin.from('user_staking_positions').select('base_token_id, amount').eq('status', 'active'),
  ]);

  const sumBy = (rows: { base_token_id: number; amount: number }[] | null) => {
    const totals = new Map<number, number>();
    for (const row of rows ?? []) totals.set(row.base_token_id, (totals.get(row.base_token_id) ?? 0) + Number(row.amount));
    return totals;
  };
  const stakedTotals = sumBy(active);
  // Rewards paid and distinct reward days per coin within the window
  const rewardTotals = new Map<number, number>();
  const rewardDays = new Map<number, Set<string>>();
  for (const batch of batches ?? []) {
    rewardTotals.set(batch.base_token_id, (rewardTotals.get(batch.base_token_id) ?? 0) + Number(batch.distributed_amount));
    if (!rewardDays.has(batch.base_token_id)) rewardDays.set(batch.base_token_id, new Set());
    rewardDays.get(batch.base_token_id)!.add(batch.reward_date);
  }

  return (assets ?? []).map((asset) => {
    const staked = stakedTotals.get(asset.base_token_id) ?? 0;
    const rewarded = rewardTotals.get(asset.base_token_id) ?? 0;
    const days = rewardDays.get(asset.base_token_id)?.size ?? 0;
    // Annualize over the days actually covered - and only with enough history to be meaningful
    const realized =
      staked > 0 && rewarded > 0 && days >= MIN_APY_HISTORY_DAYS ? (rewarded / staked) * (365 / days) * 100 : null;
    const estimated = asset.estimated_apy != null ? Number(asset.estimated_apy) : null;
    return {
      ...asset,
      min_stake: Number(asset.min_stake),
      commission_percent: Number(asset.commission_percent),
      estimated_apy: estimated,
      apy: realized ?? estimated,
      apy_is_estimate: realized === null,
      ...(options.withTotals ? { total_staked: staked } : {}),
    } as StakingAsset;
  });
}

// ─── Positions ───

export async function listUserPositions(userId: string): Promise<StakingPosition[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_staking_positions')
    .select(`*, ${TOKEN_SELECT}`)
    .eq('user_id', userId)
    .order('staked_at', { ascending: false });
  if (error) throw new StakingError('Failed to load positions', 500);
  return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount), rewards_total: Number(p.rewards_total) }));
}

export async function stake(userId: string, baseTokenId: number, amount: number) {
  if (!isFinite(amount) || amount <= 0) throw new StakingError('Invalid amount');
  const admin = createAdminClient();

  const { data: asset } = await admin
    .from('staking_assets')
    .select(`*, ${TOKEN_SELECT}`)
    .eq('base_token_id', baseTokenId)
    .eq('enabled', true)
    .single();
  if (!asset) throw new StakingError('This coin is not available for staking', 404);

  const symbol: string = asset.token?.symbol ?? '';
  if (amount < Number(asset.min_stake)) {
    throw new StakingError(`Minimum stake is ${Number(asset.min_stake)} ${symbol}`);
  }

  const { data: balance, error: balanceError } = await admin.rpc('get_user_balance', {
    p_user_id: userId,
    p_base_token_id: baseTokenId,
  });
  if (balanceError) throw new StakingError('Failed to check balance', 500);
  if (amount > parseFloat(balance?.available_balance ?? 0)) {
    throw new StakingError(`Insufficient available ${symbol} balance`);
  }

  // Debit first, then create the position; refund if the position can't be created
  await changeBalance(admin, userId, baseTokenId, amount, 'debit');
  const { data: position, error: positionError } = await admin
    .from('user_staking_positions')
    .insert({ user_id: userId, base_token_id: baseTokenId, amount })
    .select(`*, ${TOKEN_SELECT}`)
    .single();
  if (positionError || !position) {
    await changeBalance(admin, userId, baseTokenId, amount, 'credit');
    throw new StakingError('Failed to create stake', 500);
  }

  await recordTransaction(admin, userId, baseTokenId, symbol, 'staking_stake', amount, {
    position_id: position.id,
    unbonding_days: asset.unbonding_days,
  });
  return position;
}

export async function unstake(userId: string, positionId: string) {
  const admin = createAdminClient();
  const { data: position } = await admin
    .from('user_staking_positions')
    .select(`*, ${TOKEN_SELECT}`)
    .eq('id', positionId)
    .eq('user_id', userId)
    .single();
  if (!position) throw new StakingError('Stake not found', 404);
  if (position.status !== 'active') throw new StakingError('This stake is already being unstaked', 409);

  const { data: asset } = await admin
    .from('staking_assets')
    .select('unbonding_days')
    .eq('base_token_id', position.base_token_id)
    .single();
  const unbondingDays = asset?.unbonding_days ?? 0;
  const now = new Date();
  const availableAt = new Date(now.getTime() + unbondingDays * DAY_MS);

  // Conditional update: only one unstake request can win
  const { data: updated, error } = await admin
    .from('user_staking_positions')
    .update({
      status: 'unbonding',
      unstake_requested_at: now.toISOString(),
      available_at: availableAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', positionId)
    .eq('status', 'active')
    .select('id');
  if (error) throw new StakingError('Failed to unstake', 500);
  if (!updated?.length) throw new StakingError('This stake is already being unstaked', 409);

  await recordTransaction(admin, userId, position.base_token_id, position.token?.symbol ?? '', 'staking_unstake', Number(position.amount), {
    position_id: positionId,
    available_at: availableAt.toISOString(),
  });

  // No unbonding period: return the coins right away
  if (unbondingDays === 0) await releaseUnbonded(positionId);

  return { available_at: availableAt.toISOString(), unbonding_days: unbondingDays };
}

/** Release unbonding stakes whose wait is over (all, or one position) */
export async function releaseUnbonded(onlyPositionId?: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  let query = admin
    .from('user_staking_positions')
    .select(`id, user_id, base_token_id, amount, ${TOKEN_SELECT}`)
    .eq('status', 'unbonding')
    .lte('available_at', now);
  if (onlyPositionId) query = query.eq('id', onlyPositionId);
  const { data: due, error } = await query;
  if (error) throw new StakingError('Failed to load unbonding stakes', 500);

  let released = 0;
  for (const position of due ?? []) {
    // Claim the position first so concurrent runs can't release it twice
    const { data: claimed } = await admin
      .from('user_staking_positions')
      .update({ status: 'withdrawn', withdrawn_at: now, updated_at: now })
      .eq('id', position.id)
      .eq('status', 'unbonding')
      .select('id');
    if (!claimed?.length) continue;

    try {
      await changeBalance(admin, position.user_id, position.base_token_id, Number(position.amount), 'credit');
    } catch (creditError) {
      await admin
        .from('user_staking_positions')
        .update({ status: 'unbonding', withdrawn_at: null })
        .eq('id', position.id);
      console.error('[staking] Release credit failed:', creditError);
      continue;
    }

    const token = position.token as unknown as { symbol?: string } | null;
    await recordTransaction(admin, position.user_id, position.base_token_id, token?.symbol ?? '', 'staking_release', Number(position.amount), {
      position_id: position.id,
    });
    released++;
  }
  return released;
}

// ─── Rewards ───

export async function recordRewardBatch(input: {
  baseTokenId: number;
  rewardDate: string;
  grossAmount: number;
  notes?: string;
  recordedBy: string;
}) {
  if (!isFinite(input.grossAmount) || input.grossAmount <= 0) throw new StakingError('Reward amount must be positive');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.rewardDate)) throw new StakingError('Invalid reward date');
  if (new Date(`${input.rewardDate}T00:00:00Z`).getTime() > Date.now()) throw new StakingError('Reward date cannot be in the future');

  const admin = createAdminClient();
  const { data: asset } = await admin
    .from('staking_assets')
    .select('commission_percent')
    .eq('base_token_id', input.baseTokenId)
    .single();
  if (!asset) throw new StakingError('Coin is not set up for staking', 404);

  const commissionPercent = Number(asset.commission_percent);
  const { data, error } = await admin
    .from('staking_reward_batches')
    .insert({
      base_token_id: input.baseTokenId,
      reward_date: input.rewardDate,
      gross_amount: input.grossAmount,
      commission_percent: commissionPercent,
      notes: input.notes ?? null,
      recorded_by: input.recordedBy,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new StakingError('Rewards for this coin and date are already recorded', 409);
    throw new StakingError('Failed to record rewards', 500);
  }
  return data as StakingRewardBatch;
}

/**
 * Distribute every pending batch. A position earns a day's rewards if it was staked
 * before that day began (UTC) and wasn't unstaked before it ended. Each share is written
 * to staking_rewards (unique per batch + position) before the credit, so reruns never pay twice.
 */
export async function distributePendingBatches() {
  const admin = createAdminClient();
  const { data: batches, error } = await admin
    .from('staking_reward_batches')
    .select('*, token:base_tokens(symbol)')
    .in('status', ['pending', 'distributing'])
    .order('reward_date');
  if (error) throw new StakingError('Failed to load reward batches', 500);

  const results: { batch_id: string; recipients: number; distributed: number; complete: boolean }[] = [];

  for (const batch of batches ?? []) {
    await admin.from('staking_reward_batches').update({ status: 'distributing' }).eq('id', batch.id).eq('status', 'pending');

    const dayStart = new Date(`${batch.reward_date}T00:00:00Z`);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const { data: candidates } = await admin
      .from('user_staking_positions')
      .select('id, user_id, amount, unstake_requested_at, rewards_total')
      .eq('base_token_id', batch.base_token_id)
      .lt('staked_at', dayStart.toISOString());
    const eligible = (candidates ?? []).filter(
      (p) => !p.unstake_requested_at || new Date(p.unstake_requested_at) >= dayEnd
    );

    const gross = Number(batch.gross_amount);
    const commission = gross * (Number(batch.commission_percent) / 100);
    const distributable = gross - commission;
    const totalStaked = eligible.reduce((sum, p) => sum + Number(p.amount), 0);
    const symbol: string = batch.token?.symbol ?? '';

    let recipients = 0;
    let distributed = 0;
    let failures = 0;

    for (const position of totalStaked > 0 ? eligible : []) {
      const share = floorTo(distributable * (Number(position.amount) / totalStaked), SHARE_DECIMALS);
      if (share <= 0) continue;

      // Reserve the share; a unique violation means this position was already paid
      const { error: reserveError } = await admin.from('staking_rewards').insert({
        batch_id: batch.id,
        position_id: position.id,
        user_id: position.user_id,
        base_token_id: batch.base_token_id,
        amount: share,
      });
      if (reserveError) {
        if (reserveError.code !== '23505') failures++;
        continue;
      }

      try {
        await changeBalance(admin, position.user_id, batch.base_token_id, share, 'credit');
      } catch (creditError) {
        await admin.from('staking_rewards').delete().eq('batch_id', batch.id).eq('position_id', position.id);
        console.error('[staking] Reward credit failed:', creditError);
        failures++;
        continue;
      }

      await admin
        .from('user_staking_positions')
        .update({ rewards_total: Number(position.rewards_total) + share, updated_at: new Date().toISOString() })
        .eq('id', position.id);
      await recordTransaction(admin, position.user_id, batch.base_token_id, symbol, 'staking_reward', share, {
        position_id: position.id,
        batch_id: batch.id,
        reward_date: batch.reward_date,
      });
      recipients++;
      distributed += share;
    }

    // Leave the batch 'distributing' on failures so the next run retries the rest
    if (failures === 0) {
      const { data: paid } = await admin.from('staking_rewards').select('amount').eq('batch_id', batch.id);
      const totalPaid = (paid ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
      await admin
        .from('staking_reward_batches')
        .update({
          status: 'distributed',
          distributed_at: new Date().toISOString(),
          commission_amount: commission,
          distributed_amount: totalPaid,
          recipients: paid?.length ?? 0,
        })
        .eq('id', batch.id);
    }
    results.push({ batch_id: batch.id, recipients, distributed, complete: failures === 0 });
  }

  return results;
}

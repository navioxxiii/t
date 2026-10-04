/**
 * Staking types (pooled PoS staking with admin-recorded rewards)
 */

export type StakingPositionStatus = 'active' | 'unbonding' | 'withdrawn';

export interface StakingAsset {
  id: string;
  base_token_id: number;
  enabled: boolean;
  min_stake: number;
  unbonding_days: number;
  commission_percent: number;
  estimated_apy: number | null;
  token: {
    id: number;
    symbol: string;
    name: string;
    logo_url: string | null;
    is_stablecoin: boolean;
  };
  /** Trailing 30-day realized APY when there's reward history, else the estimate */
  apy: number | null;
  apy_is_estimate: boolean;
  /** Sum of active stakes across all users (admin view) */
  total_staked?: number;
}

export interface StakingPosition {
  id: string;
  base_token_id: number;
  amount: number;
  status: StakingPositionStatus;
  rewards_total: number;
  staked_at: string;
  unstake_requested_at: string | null;
  available_at: string | null;
  withdrawn_at: string | null;
  token: StakingAsset['token'];
}

export interface StakingRewardBatch {
  id: string;
  base_token_id: number;
  reward_date: string;
  gross_amount: number;
  commission_percent: number;
  commission_amount: number;
  distributed_amount: number;
  status: 'pending' | 'distributing' | 'distributed';
  recipients: number;
  notes: string | null;
  distributed_at: string | null;
  created_at: string;
}

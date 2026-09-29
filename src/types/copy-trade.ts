/**
 * Copy Trading Types
 * Shared shapes for traders, positions and API responses
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export type CopyPositionStatus = 'active' | 'stopped' | 'liquidated';

/** Minimum USDT allocation to start copying a trader (enforced client + server) */
export const MIN_COPY_ALLOCATION_USDT = 50;

export interface Trader {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  historical_roi_min: number;
  historical_roi_max: number;
  risk_level: RiskLevel;
  strategy: string;
  aum_usdt: number;
  current_copiers: number;
  max_copiers: number;
  performance_fee_percent: number;
  max_drawdown: number;
  stats: {
    monthly_roi?: number;
    win_rate?: number;
    avg_hold_time_hours?: number;
  };
  availability: {
    isFull: boolean;
    fillPercentage: number;
    remainingCapacity: number | null;
  };
  isUserCopying?: boolean;
  isUserOnWaitlist?: boolean;
}

export interface CopyPosition {
  id: string;
  allocation_usdt: number;
  current_pnl: number;
  daily_pnl_rate: number;
  status: CopyPositionStatus;
  started_at: string;
  stopped_at?: string;
  /** Net P&L after performance fee */
  final_pnl?: number;
  performance_fee_paid?: number;
  trader: {
    id: string;
    name: string;
    avatar_url: string;
    strategy: string;
    performance_fee_percent: number;
    risk_level: string;
  };
}

export interface PositionsData {
  grouped: {
    active: CopyPosition[];
    stopped: CopyPosition[];
    liquidated: CopyPosition[];
  };
  summary: {
    total_active_positions: number;
    total_invested: number;
    total_current_pnl: number;
    total_current_value: number;
    total_lifetime_profit: number;
  };
}

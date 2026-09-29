/**
 * Copy Trading display helpers
 */

import type { Trader } from '@/types/copy-trade';

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low':
      return 'bg-action-green/10 text-action-green border-action-green/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'high':
      return 'bg-action-red/10 text-action-red border-action-red/30';
    default:
      return 'bg-bg-tertiary text-text-secondary';
  }
}

export const RISK_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };

/** Monthly ROI in percent; falls back to the historical midpoint only when no stat exists */
export function getMonthlyRoi(trader: Pick<Trader, 'stats' | 'historical_roi_min' | 'historical_roi_max'>): number {
  return (
    trader.stats?.monthly_roi ??
    (Number(trader.historical_roi_min) + Number(trader.historical_roi_max)) / 2
  );
}

/** Performance fee is charged on profits only */
export function calcPayout(allocation: number, pnl: number, feePercent: number) {
  const fee = pnl > 0 ? pnl * (feePercent / 100) : 0;
  return { fee, net: allocation + pnl - fee };
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

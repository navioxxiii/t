/**
 * Plisio Configuration Constants
 * Centralized configuration for Plisio integration
 */

/**
 * Map coin symbols to Plisio psys_cid identifiers
 * Used for withdrawal operations via Plisio API
 */
export const PLISIO_COIN_MAP: Record<string, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  USDT: 'USDT_TRX', // USDT on Tron network
  DOGE: 'DOGE',
  TRX: 'TRX',
  LTC: 'LTC',
} as const;

/**
 * Get Plisio currency ID for a coin symbol
 * @throws Error if coin not supported
 */
export function getPlisioCoinId(coinSymbol: string): string {
  const psysCid = PLISIO_COIN_MAP[coinSymbol];
  if (!psysCid) {
    throw new Error(`Unsupported coin for Plisio: ${coinSymbol}`);
  }
  return psysCid;
}

/**
 * Check if coin is supported by Plisio
 */
export function isPlisioSupported(coinSymbol: string): boolean {
  return coinSymbol in PLISIO_COIN_MAP;
}

/**
 * Fee plans supported by Plisio
 */
export const PLISIO_FEE_PLANS = ['normal', 'priority'] as const;
export type PlisioFeePlan = (typeof PLISIO_FEE_PLANS)[number];

/**
 * Default fee plan for withdrawals
 */
export const DEFAULT_FEE_PLAN: PlisioFeePlan = 'normal';

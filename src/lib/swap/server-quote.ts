/**
 * Server-side swap quote - the single source of truth for swap pricing.
 * Used by /api/swap/quote (what the user sees) and /api/swap (what gets credited),
 * so both always price from the same sources.
 */

import { SWAP_FEE_PERCENTAGE, type SwapEstimate } from '@/lib/binance/swap';
import { getServerPrices } from '@/lib/prices/server-prices';

/** Returns null when either price is unavailable - callers must not proceed without a quote */
export async function getServerSwapQuote(
  fromCoin: string,
  toCoin: string,
  fromAmount: number
): Promise<SwapEstimate | null> {
  if (!isFinite(fromAmount) || fromAmount <= 0) return null;

  const prices = await getServerPrices([fromCoin, toCoin]);
  const fromPrice = prices.get(fromCoin);
  const toPrice = prices.get(toCoin);
  if (!fromPrice || !toPrice) return null;

  const usdValue = fromAmount * fromPrice;
  const feeAmount = usdValue * (SWAP_FEE_PERCENTAGE / 100);
  // The fee comes out of what you receive; the full fromAmount is debited
  const toAmount = (usdValue - feeAmount) / toPrice;

  return {
    fromCoin,
    toCoin,
    fromAmount,
    toAmount,
    fromPrice,
    toPrice,
    rate: toAmount / fromAmount,
    feePercentage: SWAP_FEE_PERCENTAGE,
    feeAmount,
    totalUsdValue: usdValue,
    estimatedAt: new Date().toISOString(),
    isHighPriority: true,
  };
}

// Note: We call our Next.js API route instead of Binance directly
// to avoid CORS issues in the browser

import { CoinPrice } from "../prices/prices-client";
import { pricesClient } from "../prices/prices-client";

/**
 * @deprecated This hardcoded map is kept for backward compatibility with useCoinChart.
 * The database-driven coin system should be used instead (src/lib/coins/coin-cache.ts).
 *
 * Price providers now fetch their symbol mappings from the database via the
 * price_provider_id field in the coins table.
 *
 * TODO: Refactor useCoinChart to use database instead of this hardcoded map.
 */
export const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  USDT: "USDT", // Special case - USDT is always $1.00
  DOGE: "DOGEUSDT",
  TRX: "TRXUSDT",
  LTC: "LTCUSDT",
};

/**
 * Fetch current prices for specified coins using unified prices client
 * @param symbols Array of coin symbols (e.g., ['BTC', 'ETH'])
 * @returns Map of symbol to price data
 */
export async function fetchCoinPrices(
  symbols: string[]
): Promise<Map<string, CoinPrice>> {
  try {
    if (symbols.length === 0) {
      return new Map();
    }

    // Use our unified prices client (handles Binance/CoinGecko fallback)
    const priceMap = await pricesClient.fetchPrices(symbols);

    console.log(
      `[fetchCoinPrices] Successfully fetched ${priceMap.size} prices from multiple providers`
    );
    return priceMap;
  } catch (error) {
    console.error("Error fetching coin prices:", error);
    // Return empty map instead of throwing to prevent UI crashes
    // React Query will handle retry logic
    return new Map();
  }
}

/**
 * Fetch price for a single coin
 * @param symbol Coin symbol (e.g., 'BTC')
 * @returns Price data for the coin
 */
export async function fetchCoinPrice(
  symbol: string
): Promise<CoinPrice | null> {
  const priceMap = await fetchCoinPrices([symbol]);
  return priceMap.get(symbol) || null;
}

/**
 * Calculate total portfolio value in USD
 * @param balances Map of symbol to balance amount
 * @param prices Map of symbol to price data
 * @returns Total value in USD
 */
export function calculatePortfolioValue(
  balances: Map<string, number>,
  prices: Map<string, CoinPrice>
): number {
  let total = 0;

  for (const [symbol, balance] of balances.entries()) {
    const price = prices.get(symbol);
    if (price) {
      total += balance * price.current_price;
    }
  }

  return total;
}

/**
 * Calculate 24h portfolio change
 * @param balances Map of symbol to balance amount
 * @param prices Map of symbol to price data
 * @returns Object with absolute and percentage change
 */
export function calculatePortfolioChange(
  balances: Map<string, number>,
  prices: Map<string, CoinPrice>
): { change: number; changePercentage: number } {
  let currentValue = 0;
  let previousValue = 0;

  for (const [symbol, balance] of balances.entries()) {
    const price = prices.get(symbol);
    if (price) {
      currentValue += balance * price.current_price;
      const previousPrice = price.current_price - price.price_change_24h;
      previousValue += balance * previousPrice;
    }
  }

  const change = currentValue - previousValue;
  const changePercentage =
    previousValue > 0 ? (change / previousValue) * 100 : 0;

  return { change, changePercentage };
}

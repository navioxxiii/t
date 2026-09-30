/**
 * Server-side USD prices for money-moving routes
 *
 * The browser price client goes through our own /api proxies with relative URLs, so it
 * can't run on the server - and server routes must never trust prices sent by the client.
 * This fetches the same sources directly: stablecoins at $1, Binance.US first, CoinGecko
 * as fallback. Symbols it can't price are left out; callers must treat that as a failure.
 */

import { coinCache } from '@/lib/coins/coin-cache';

const TIMEOUT_MS = 8000;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

export async function getServerPrices(symbols: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const binanceIds = new Map<string, string>(); // pair -> symbol
  const coingeckoIds = new Map<string, string>(); // id -> symbol

  for (const symbol of new Set(symbols)) {
    const coin = await coinCache.getCoin(symbol);
    if (!coin) continue;
    if (coin.is_stablecoin) {
      prices.set(symbol, 1);
      continue;
    }
    if (coin.binance_id) binanceIds.set(coin.binance_id, symbol);
    if (coin.coingecko_id) coingeckoIds.set(coin.coingecko_id, symbol);
  }

  // Binance.US batch ticker
  if (binanceIds.size > 0) {
    try {
      const pairs = JSON.stringify([...binanceIds.keys()]);
      const tickers = (await fetchJson(
        `https://api.binance.us/api/v3/ticker/price?symbols=${encodeURIComponent(pairs)}`
      )) as { symbol: string; price: string }[];
      for (const { symbol: pair, price } of tickers) {
        const value = parseFloat(price);
        const symbol = binanceIds.get(pair);
        if (symbol && isFinite(value) && value > 0) prices.set(symbol, value);
      }
    } catch (error) {
      console.error('[server-prices] Binance.US failed:', error);
    }
  }

  // CoinGecko for anything still missing
  const missing = [...coingeckoIds].filter(([, symbol]) => !prices.has(symbol));
  if (missing.length > 0) {
    try {
      const ids = missing.map(([id]) => id).join(',');
      const data = (await fetchJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`
      )) as Record<string, { usd?: number }>;
      for (const [id, symbol] of missing) {
        const value = data[id]?.usd;
        if (typeof value === 'number' && isFinite(value) && value > 0) prices.set(symbol, value);
      }
    } catch (error) {
      console.error('[server-prices] CoinGecko failed:', error);
    }
  }

  return prices;
}

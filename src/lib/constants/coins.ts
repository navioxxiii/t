/**
 * Supported Cryptocurrencies Configuration (LEGACY)
 *
 * @deprecated This file contains hardcoded coin configurations.
 * The database-driven coin system (src/lib/coins/coin-cache.ts) should be used instead.
 *
 * Current migration status:
 * - ✅ Price providers: Now use database (CoinGecko, Binance, Binance US)
 * - ✅ Send fee estimation: Now uses database
 * - ⚠️ UI utilities (getCoinIconPath, formatBalance): Still use this file
 *
 * These utility functions are kept for backward compatibility but should eventually
 * be refactored to use the database via the coin cache service.
 *
 * Based on Plisio's supported coins (6 total for this project)
 * Each coin has a specific Plisio currency ID (psys_cid)
 *
 * Note: minAmount is for withdrawal validation (send feature)
 * Not needed for deposit addresses (no minimum for receiving)
 */

export const PLISIO_COINS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    psys_cid: 'BTC',
    decimals: 8,
    network: 'Bitcoin',
    icon: '₿',
    iconPath: '/icons/crypto/btc.svg',
    minAmount: '0.0001', // Minimum for withdrawals
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    psys_cid: 'ETH',
    decimals: 18,
    network: 'Ethereum',
    icon: 'Ξ',
    iconPath: '/icons/crypto/eth.svg',
    minAmount: '0.001', // Minimum for withdrawals
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    psys_cid: 'USDT_TRX', // TRC-20 (Tron network)
    decimals: 6,
    network: 'TRC-20',
    icon: '₮',
    iconPath: '/icons/crypto/usdt.svg',
    minAmount: '5.01', // Minimum for withdrawals (Plisio requires > 5.001200)
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    psys_cid: 'DOGE',
    decimals: 8,
    network: 'Dogecoin',
    icon: 'Ð',
    iconPath: '/icons/crypto/doge.svg',
    minAmount: '1.1', // Minimum for withdrawals (Plisio requires > 1.00000000)
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    psys_cid: 'TRX',
    decimals: 6,
    network: 'Tron',
    icon: '₮',
    iconPath: '/icons/crypto/trx.svg',
    minAmount: '3.6', // Minimum for withdrawals (Plisio requires > 3.544779)
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    psys_cid: 'LTC',
    decimals: 8,
    network: 'Litecoin',
    icon: 'Ł',
    iconPath: '/icons/crypto/ltc.svg',
    minAmount: '0.01', // Minimum for withdrawals
  },
] as const;

export type PlisioCoin = typeof PLISIO_COINS[number];

/**
 * Get coin configuration by symbol
 *
 * @deprecated SCHEDULED FOR REMOVAL: v2.0.0 (Q1 2025)
 *
 * Use coinConfigClient.getCoin() from @/lib/coins/coin-config-client instead.
 *
 * Migration path:
 * - For images: Use balance.token.logo_url from useBalances() hook
 * - For decimals: Use balance.token.decimals from useBalances() hook
 * - For async access: Use coinConfigClient.getCoin(symbol)
 */
export function getCoinBySymbol(symbol: string): PlisioCoin | undefined {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED - REMOVAL SCHEDULED v2.0.0] getCoinBySymbol("${symbol}") called. ` +
      `See migration guide in @/lib/constants/coins.ts`
    );
  }
  return PLISIO_COINS.find(coin => coin.symbol === symbol);
}

/**
 * Get coin configuration by Plisio currency ID
 */
export function getCoinByPsysCid(psys_cid: string): PlisioCoin | undefined {
  return PLISIO_COINS.find(coin => coin.psys_cid === psys_cid);
}

/**
 * Format balance with proper decimal places
 *
 * @deprecated SCHEDULED FOR REMOVAL: v2.0.0 (Q1 2025)
 *
 * Use balance.token.decimals from useBalances() hook instead.
 *
 * Migration path:
 * - Use `formatCrypto()` from @/lib/utils/currency instead (recommended)
 * - Or: `Number(balance).toFixed(token.decimals)`
 */
export function formatBalance(balance: string | number, symbol: string): string {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED - REMOVAL SCHEDULED v2.0.0] formatBalance("${symbol}") called. ` +
      `Use formatCrypto() from @/lib/utils/currency instead.`
    );
  }
  const coin = getCoinBySymbol(symbol);
  if (!coin) return balance.toString();

  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  return numBalance.toFixed(coin.decimals);
}

/**
 * Get coin icon path by symbol
 *
 * @deprecated SCHEDULED FOR REMOVAL: v2.0.0 (Q1 2025)
 *
 * Use balance.token.logo_url from useBalances() hook instead.
 *
 * Migration path:
 * - In React components: Use `balance.token.logo_url ?? '/icons/crypto/default.svg'`
 * - For async access: Use `coinConfigClient.getCoin(symbol).logo_url`
 *
 * WARNING: This function only supports 6 hardcoded coins (BTC, ETH, USDT, DOGE, TRX, LTC).
 * All other coins will return the default icon even if database has logo_url.
 */
export function getCoinIconPath(symbol: string): string {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED - REMOVAL SCHEDULED v2.0.0] getCoinIconPath("${symbol}") called. ` +
      `Use balance.token.logo_url from useBalances() hook instead. ` +
      `See migration guide in @/lib/constants/coins.ts`
    );
  }
  const coin = getCoinBySymbol(symbol);
  return coin?.iconPath ?? '/icons/crypto/default.svg';
}

/**
 * Get coin icon path by symbol (async, database-driven)
 * @deprecated Use React Query hook instead for better caching
 */
export async function getCoinIconPathAsync(symbol: string): Promise<string> {
  // Dynamic import to avoid circular dependencies
  const { coinConfigClient } = await import('@/lib/coins/coin-config-client');
  const coin = await coinConfigClient.getCoin(symbol);
  return coin?.logo_url ?? '/icons/crypto/default.svg';
}
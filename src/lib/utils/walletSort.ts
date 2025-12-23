/**
 * Wallet Sorting Utilities
 * Functions to sort wallets by different criteria
 */

import type { CoinPrice } from "@/lib/prices/prices-client";

interface WalletBase {
  id: string;
  coin_symbol: string;
  balance: string | number;
}

/**
 * Sort wallets by USD value (balance × price) in descending order
 * Wallets with no price data or zero balance are placed at the end
 */
export function sortWalletsByUsdValue<T extends WalletBase>(
  wallets: T[],
  pricesMap?: Map<string, CoinPrice>
): T[] {
  return [...wallets].sort((a, b) => {
    const balanceA = parseFloat(a.balance.toString());
    const balanceB = parseFloat(b.balance.toString());

    const priceA = pricesMap?.get(a.coin_symbol);
    const priceB = pricesMap?.get(b.coin_symbol);

    // Calculate USD values
    const usdValueA = priceA ? balanceA * priceA.current_price : 0;
    const usdValueB = priceB ? balanceB * priceB.current_price : 0;

    // If both have no value, maintain original order
    if (usdValueA === 0 && usdValueB === 0) return 0;

    // Sort by USD value descending (highest first)
    return usdValueB - usdValueA;
  });
}

/**
 * Sort wallets alphabetically by coin symbol (A-Z)
 */
export function sortWalletsAlphabetically<T extends WalletBase>(
  wallets: T[]
): T[] {
  return [...wallets].sort((a, b) => {
    return a.coin_symbol.localeCompare(b.coin_symbol);
  });
}

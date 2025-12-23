import { useQuery } from "@tanstack/react-query";
import { pricesClient, type CoinPrice } from "@/lib/prices/prices-client";

/**
 * Hook to fetch prices for multiple coins from both Binance and CoinGecko
 * Uses parallel fetching based on primary_provider setting
 * Refetches every 60 seconds with error handling
 * Shows stale data if API fails - better UX than showing errors
 */
export function useCoinPrices(symbols: string[]) {
  return useQuery({
    queryKey: ["coin-prices", symbols.sort().join(",")],
    queryFn: async () => {
      const pricesMap = await pricesClient.fetchPrices(symbols);
      return pricesMap;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (increased from 5)
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true, // Refetch on window focus for fresh data
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    placeholderData: (previousData) => previousData, // Show stale data while fetching/on error
    enabled: symbols.length > 0,
  });
}

/**
 * Hook to fetch price for a single coin from Binance or CoinGecko
 * Uses primary_provider setting from database
 * Refetches every 60 seconds with error handling
 * Shows stale data if API fails - better UX than showing errors
 */
export function useCoinPrice(symbol: string) {
  return useQuery({
    queryKey: ["coin-price", symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const pricesMap = await pricesClient.fetchPrices([symbol]);
      return pricesMap.get(symbol) || null;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (increased from 5)
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true, // Refetch on window focus for fresh data
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    placeholderData: (previousData) => previousData, // Show stale data while fetching/on error
    enabled: !!symbol,
  });
}

/**
 * Hook to get all available coin symbols from wallets
 * Combines with price data from both Binance and CoinGecko
 * Shows stale data if API fails - better UX than showing errors
 */
export function useAllCoinPrices() {
  // This will be populated with symbols from wallets
  // For now, we'll fetch all supported coins
  const symbols = ["BTC", "ETH", "USDT", "DOGE", "TRX", "LTC"];

  return useQuery({
    queryKey: ["all-coin-prices"],
    queryFn: async () => {
      const pricesMap = await pricesClient.fetchPrices(symbols);
      return pricesMap;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (increased from 5)
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true, // Refetch on window focus for fresh data
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    placeholderData: (previousData) => previousData, // Show stale data while fetching/on error
  });
}

/**
 * Get price for a specific coin from the price map
 */
export function getCoinPrice(
  priceMap: Map<string, CoinPrice> | undefined,
  symbol: string
): CoinPrice | null {
  if (!priceMap) return null;
  return priceMap.get(symbol) || null;
}

/**
 * Format price change for display
 */
export function formatPriceChange(change: number): {
  formatted: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formatted = `${isPositive ? "+" : ""}${change.toFixed(2)}%`;

  return {
    formatted,
    isPositive,
    isNegative,
    isNeutral,
  };
}

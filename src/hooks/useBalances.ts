/**
 * Balance Hooks - Unified Balance System
 *
 * Hooks for fetching user balances from the new centralized balance system.
 * Replaces useWallets hooks for components migrating to unified balance structure.
 */

import { useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { UserBalance, BalancesResponse } from '@/types/balance';
import { useTokenPreferences } from './useTokenPreferences';
import { useDisplayPreferences } from './useDisplayPreferences';

/**
 * Fetch balances from API
 */
async function fetchBalances(includeZero = false): Promise<UserBalance[]> {
  const params = new URLSearchParams();
  if (includeZero) params.append('include_zero', 'true');

  const response = await fetch(`/api/wallets?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch balances');
  }

  const data: BalancesResponse = await response.json();
  return data.balances;
}

/**
 * Hook to fetch and manage user balances
 *
 * Features:
 * - Automatic retries (3x with exponential backoff)
 * - Caching (5 minutes default)
 * - Background refetching
 * - Loading and error states
 *
 * @param includeZero - Include tokens with zero balance (default: false)
 * @returns Query result with balances data
 *
 * @example
 * ```tsx
 * const { data: balances, isLoading, error } = useBalances();
 * ```
 */
export function useBalances(includeZero = false): UseQueryResult<UserBalance[], Error> {
  return useQuery({
    queryKey: ['balances', includeZero],
    queryFn: () => fetchBalances(includeZero),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60 * 1000, // 60 seconds (1 minute) for better UX
  });
}

/**
 * Hook to fetch a single token balance by token code
 *
 * @param tokenCode - Token code (e.g., 'usdt', 'btc')
 * @returns Query result with single balance or undefined
 *
 * @example
 * ```tsx
 * const { data: usdtBalance } = useTokenBalance('usdt');
 * ```
 */
export function useTokenBalance(tokenCode: string) {
  const query = useBalances();
  const balance = query.data?.find((b) => b.token.code === tokenCode);

  return {
    ...query,
    data: balance,
  };
}

/**
 * Hook to get visible balances (non-zero by default)
 *
 * This is the main hook to use for displaying user's active tokens
 *
 * @returns Query result with non-zero balances
 *
 * @example
 * ```tsx
 * const { data: visibleBalances } = useVisibleBalances();
 * ```
 */
export function useVisibleBalances(): UseQueryResult<UserBalance[], Error> {
  return useBalances(false); // Only non-zero balances
}

/**
 * Hook to get all balances including zero balances
 *
 * Useful for admin views or complete balance listings
 *
 * @returns Query result with all balances
 *
 * @example
 * ```tsx
 * const { data: allBalances } = useAllBalances();
 * ```
 */
export function useAllBalances(): UseQueryResult<UserBalance[], Error> {
  return useBalances(true); // Include zero balances
}

/**
 * Hook to get balances filtered by user preferences
 * Applies BOTH token visibility preferences AND non-zero balance filter
 *
 * This is the recommended hook for displaying the coin list on the dashboard.
 * It respects user's token visibility preferences and display preferences.
 *
 * @returns Query result with filtered balances
 *
 * @example
 * ```tsx
 * const { data: balances, isLoading } = useFilteredBalances();
 * ```
 */
export function useFilteredBalances(): UseQueryResult<UserBalance[], Error> {
  // Fetch all balances (including zero)
  const balancesQuery = useBalances(true);

  // Fetch token preferences
  const { data: tokenPrefs } = useTokenPreferences();

  // Fetch display preferences
  const { data: displayPrefs } = useDisplayPreferences();

  // Apply filtering logic
  const filteredData = useMemo(() => {
    if (!balancesQuery.data) return [];

    let filtered = balancesQuery.data;

    // Filter 1: Token visibility preferences (is_visible = true)
    if (tokenPrefs && tokenPrefs.length > 0) {
      const visibleTokenIds = new Set(
        tokenPrefs
          .filter((pref) => pref.is_visible)
          .map((pref) => pref.base_token_id)
      );

      filtered = filtered.filter((balance) =>
        visibleTokenIds.has(balance.token.id)
      );
    }

    // Filter 2: Non-zero balance (if enabled)
    if (displayPrefs?.show_non_zero_only) {
      filtered = filtered.filter(
        (balance) => parseFloat(balance.balance) > 0
      );
    }

    return filtered;
  }, [balancesQuery.data, tokenPrefs, displayPrefs]);

  // Return a modified query result with filtered data
  return {
    ...balancesQuery,
    data: filteredData,
  } as UseQueryResult<UserBalance[], Error>;
}

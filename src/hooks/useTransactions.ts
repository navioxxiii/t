/**
 * TanStack Query Hooks for Transactions
 * Provides transaction fetching with automatic retry and caching
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

// Metadata type for earn transactions
export interface EarnMetadata {
  apy?: number;
  duration_months?: number;
  vault_title?: string;
  matures_at?: string;
  principal?: number;
  profit?: number;
}

// Metadata type for copy trade transactions
export interface CopyTradeMetadata {
  trader_name?: string;
  allocation?: number;
  user_profit_after_fee?: number;
  trader_fee?: number;
  performance_fee_percent?: number;
  principal?: number;
  profit?: number;
  apy?: number;
  duration_months?: number;
  started_at?: string;
  stopped_at?: string;
}

export type TransactionMetadata = EarnMetadata | CopyTradeMetadata | null;

// Token info type (matches base_tokens table)
export interface TokenInfo {
  id: number;
  code: string;
  symbol: string;
  name: string;
  logo_url: string | null;
  decimals: number;
  icon: string | null;
}

// Transaction type definition
export interface Transaction {
  id: string;
  type:
    | "deposit"
    | "withdrawal"
    | "swap"
    | "earn_claim"
    | "earn_invest"
    | "copy_trade_start"
    | "copy_trade_stop";
  amount: string;
  coin_symbol: string;
  token: TokenInfo | null; // NEW: Token data from base_tokens
  status: "pending" | "completed" | "failed" | "cancelled";
  tx_hash: string | null;
  to_address: string | null;
  from_address: string | null;
  network_fee: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  metadata: TransactionMetadata;
  // Swap-specific fields
  swap_from_coin?: string;
  swap_to_coin?: string;
  swap_from_amount?: number;
  swap_to_amount?: number;
  swap_rate?: number;
  swap_fee_percentage?: number;
  // NEW: Swap token data
  swap_from_token?: TokenInfo | null;
  swap_to_token?: TokenInfo | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TransactionFilters {
  coin?: string; // Legacy: symbol-based filtering
  base_token_id?: number; // NEW: ID-based filtering (preferred)
  type?: "deposit" | "withdrawal" | "swap";
  status?: "pending" | "completed" | "failed" | "cancelled";
  limit?: number;
  offset?: number;
}

/**
 * Fetch transactions from API
 */
async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();

  // Prefer base_token_id over coin symbol (more efficient)
  if (filters.base_token_id) {
    params.append("base_token_id", filters.base_token_id.toString());
  } else if (filters.coin) {
    params.append("coin", filters.coin);
  }

  if (filters.type) params.append("type", filters.type);
  if (filters.status) params.append("status", filters.status);
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());

  const response = await fetch(`/api/transactions?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch transactions");
  }

  return response.json();
}

/**
 * Hook to fetch transactions with TanStack Query
 *
 * Features:
 * - Automatic retries (3x with exponential backoff)
 * - Caching (5 minutes default)
 * - Background refetching
 * - Loading and error states
 *
 * @param filters - Optional filters for transactions
 * @returns Query result with transactions data
 */
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
}

/**
 * Hook to fetch recent transactions (last 10)
 */
export function useRecentTransactions() {
  return useTransactions({ limit: 10, offset: 0 });
}

/**
 * Hook to fetch transactions for a specific coin
 * @param baseTokenId - The base token ID to filter by
 */
export function useCoinTransactions(baseTokenId: number) {
  return useTransactions({ base_token_id: baseTokenId });
}

/**
 * Hook to fetch pending transactions
 */
export function usePendingTransactions() {
  return useTransactions({ status: "pending" });
}

/**
 * Hook to fetch deposit history
 */
export function useDepositHistory(limit = 20) {
  return useTransactions({ type: "deposit", limit });
}

/**
 * Hook to fetch withdrawal history
 */
export function useWithdrawalHistory(limit = 20) {
  return useTransactions({ type: "withdrawal", limit });
}

/**
 * Hook to fetch transactions with infinite scroll
 * Useful for paginated transaction lists
 *
 * @param filters - Base filters (without offset)
 * @param pageSize - Number of items per page (default: 20)
 * @returns Infinite query result with transactions data
 */
export function useInfiniteTransactions(
  filters: Omit<TransactionFilters, "offset"> = {},
  pageSize: number = 20
) {
  return useInfiniteQuery({
    queryKey: ["transactions-infinite", filters, pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchTransactions({
        ...filters,
        limit: pageSize,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch infinite transactions for a specific coin
 * @param baseTokenId - The base token ID to filter by
 * @param pageSize - Number of items per page (default: 20)
 */
export function useInfiniteCoinTransactions(
  baseTokenId: number,
  pageSize: number = 20
) {
  return useInfiniteTransactions({ base_token_id: baseTokenId }, pageSize);
}

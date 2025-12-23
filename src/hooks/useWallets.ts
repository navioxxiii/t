import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Wallet {
  id: string;
  coin_symbol: string;
  coin_name: string;
  address: string;
  balance: string;
  network: string;
  qr_code?: string;
}

export interface WalletsResponse {
  wallets: Wallet[];
}

export interface WalletFilters {
  coin?: string;
}

/**
 * Fetch wallets from API
 */
async function fetchWallets(filters: WalletFilters = {}): Promise<Wallet[]> {
  const params = new URLSearchParams();

  if (filters.coin) params.append('coin', filters.coin);

  const response = await fetch(`/api/wallets?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch wallets');
  }

  const data: WalletsResponse = await response.json();
  return data.wallets;
}

/**
 * Generate new wallets for the current user
 */
async function generateWallets(): Promise<{ wallets: Wallet[]; message: string }> {
  const response = await fetch('/api/wallets/generate', {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate wallets');
  }

  return data;
}

/**
 * Hook to fetch and manage wallets
 *
 * Features:
 * - Automatic retries (3x with exponential backoff)
 * - Caching (5 minutes default)
 * - Background refetching
 * - Loading and error states
 *
 * @param filters - Optional filters for wallets
 * @returns Query result with wallets data
 */
export function useWallets(filters: WalletFilters = {}) {
  return useQuery({
    queryKey: ['wallets', filters],
    queryFn: () => fetchWallets(filters),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to generate wallets
 */
export function useGenerateWallets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateWallets,
    onSuccess: () => {
      // Invalidate and refetch wallets after successful generation
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

/**
 * Hook to fetch wallet for a specific coin
 */
export function useWalletByCoin(coinSymbol: string) {
  return useWallets({ coin: coinSymbol });
}

/**
 * Hook to fetch all wallets (alias for backward compatibility)
 */
export function useAllWallets() {
  return useWallets();
}

/**
 * Fetch only visible wallets from API
 * Filters out hidden coins and placeholder addresses
 */
async function fetchVisibleWallets(filters: WalletFilters = {}): Promise<Wallet[]> {
  const params = new URLSearchParams();

  if (filters.coin) params.append('coin', filters.coin);

  const response = await fetch(`/api/wallets/visible?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch visible wallets');
  }

  const data: WalletsResponse = await response.json();
  return data.wallets;
}

/**
 * Hook to fetch only visible wallets
 * This respects user coin visibility preferences
 * and excludes placeholder addresses
 *
 * @param filters - Optional filters for wallets
 * @returns Query result with visible wallets only
 */
export function useVisibleWallets(filters: WalletFilters = {}) {
  return useQuery({
    queryKey: ['wallets', 'visible', filters],
    queryFn: () => fetchVisibleWallets(filters),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

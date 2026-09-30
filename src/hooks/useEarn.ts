/**
 * TanStack Query Hooks for Earn
 * Queries for vaults/positions and mutations for invest/claim with automatic cache invalidation
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ClaimResponse,
  InvestRequest,
  InvestResponse,
  PositionsResponse,
  VaultWithAvailability,
} from '@/types/earn';

// ═══════════════════════════════════════════════════════════════════════════
// FETCHERS
// ═══════════════════════════════════════════════════════════════════════════

async function postJson<T>(url: string, body: unknown, fallbackError: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackError);
  }
  return data;
}

// Supabase numeric columns can arrive as strings - normalize before rendering
function normalizeVault(v: VaultWithAvailability): VaultWithAvailability {
  return {
    ...v,
    apy_percent: Number(v.apy_percent),
    duration_months: Number(v.duration_months) as VaultWithAvailability['duration_months'],
    min_amount: Number(v.min_amount),
    max_amount: v.max_amount != null ? Number(v.max_amount) : null,
    total_capacity: v.total_capacity != null ? Number(v.total_capacity) : null,
    current_filled: Number(v.current_filled) || 0,
  };
}

async function fetchVaults(): Promise<VaultWithAvailability[]> {
  const response = await fetch('/api/earn/vaults');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch vaults');
  }
  return (data.vaults || []).map(normalizeVault);
}

async function fetchPositions(): Promise<PositionsResponse> {
  const response = await fetch('/api/earn/positions');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch positions');
  }
  return data;
}

function invalidateEarnQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['balances'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['wallets'] }); // Backward compatibility
  queryClient.invalidateQueries({ queryKey: ['earn-positions'] });
  queryClient.invalidateQueries({ queryKey: ['earn-vaults'] }); // Capacity changes
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to fetch all active vaults with availability
 */
export function useEarnVaults() {
  return useQuery({
    queryKey: ['earn-vaults'],
    queryFn: fetchVaults,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get a single vault - shares the vaults list cache
 */
export function useEarnVault(id: string) {
  const query = useEarnVaults();
  return {
    ...query,
    data: query.data?.find((v) => v.id === id),
  };
}

/**
 * Hook to fetch the user's earn positions, grouped by status
 */
export function useEarnPositions() {
  return useQuery({
    queryKey: ['earn-positions'],
    queryFn: fetchPositions,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to invest in an earn vault
 */
export function useEarnInvest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: InvestRequest) =>
      postJson<InvestResponse>('/api/earn/invest', request, 'Investment failed'),
    onSuccess: (data) => {
      invalidateEarnQueries(queryClient);
      toast.success('Investment Successful', {
        description: data.message || `Successfully invested ${data.position.amount_usdt} USDT`,
      });
    },
    onError: (error: Error) => {
      toast.error('Investment Failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to claim a matured position - credits principal + profit to the wallet
 */
export function useEarnClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) =>
      postJson<ClaimResponse>('/api/earn/claim', { positionId }, 'Claim failed'),
    onSuccess: (data) => {
      invalidateEarnQueries(queryClient);
      toast.success(data.message || 'Claimed successfully');
    },
    onError: (error: Error) => {
      // Already claimed elsewhere - refresh so the card disappears
      invalidateEarnQueries(queryClient);
      toast.error(error.message);
    },
  });
}

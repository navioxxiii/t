/**
 * TanStack Query Hooks for Copy Trading Operations
 * Queries for traders/positions and mutations for start/stop/waitlist with automatic cache invalidation
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CopyPosition, PositionsData, Trader } from '@/types/copy-trade';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CopyTradeStartRequest {
  traderId: string;
  amount: number;
}

export interface CopyTradeStartResponse {
  success: boolean;
  position: {
    id: string;
    user_id: string;
    trader_id: string;
    allocation_usdt: number;
    current_pnl: number;
    daily_pnl_rate: number;
    status: string;
    trader: {
      id: string;
      name: string;
      avatar_url: string;
      strategy: string;
      risk_level: string;
    };
  };
  message: string;
}

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
function normalizeTrader(t: Trader): Trader {
  return {
    ...t,
    historical_roi_min: Number(t.historical_roi_min),
    historical_roi_max: Number(t.historical_roi_max),
    aum_usdt: Number(t.aum_usdt),
    current_copiers: Number(t.current_copiers) || 0,
    max_copiers: Number(t.max_copiers),
    performance_fee_percent: Number(t.performance_fee_percent),
    max_drawdown: Number(t.max_drawdown),
    stats: t.stats ?? {},
  };
}

function normalizePosition(p: CopyPosition): CopyPosition {
  return {
    ...p,
    allocation_usdt: Number(p.allocation_usdt),
    current_pnl: Number(p.current_pnl),
    daily_pnl_rate: Number(p.daily_pnl_rate),
    final_pnl: p.final_pnl != null ? Number(p.final_pnl) : undefined,
    performance_fee_paid: p.performance_fee_paid != null ? Number(p.performance_fee_paid) : undefined,
    trader: {
      ...p.trader,
      performance_fee_percent: Number(p.trader.performance_fee_percent),
    },
  };
}

async function fetchTraders(): Promise<Trader[]> {
  const response = await fetch('/api/copy-trade/traders');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch traders');
  }
  return (data.traders || []).map(normalizeTrader);
}

async function fetchPositions(): Promise<PositionsData> {
  const response = await fetch('/api/copy-trade/positions');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch positions');
  }
  return {
    grouped: {
      active: data.grouped.active.map(normalizePosition),
      stopped: data.grouped.stopped.map(normalizePosition),
      liquidated: data.grouped.liquidated.map(normalizePosition),
    },
    summary: data.summary,
  };
}

function invalidateCopyTradeQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['balances'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['wallets'] }); // Backward compatibility
  queryClient.invalidateQueries({ queryKey: ['copy-positions'] });
  queryClient.invalidateQueries({ queryKey: ['traders'] }); // Trader stats might change
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to fetch all traders with availability and user flags
 * (isUserCopying, isUserOnWaitlist)
 */
export function useTraders() {
  return useQuery({
    queryKey: ['traders'],
    queryFn: fetchTraders,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get a single trader - shares the traders list cache
 */
export function useTrader(id: string) {
  const query = useTraders();
  return {
    ...query,
    data: query.data?.find((t) => t.id === id),
  };
}

/**
 * Hook to fetch the user's copy positions, grouped by status.
 * Refetches every 5 minutes to match the tick-cron schedule.
 */
export function useCopyPositions() {
  return useQuery({
    queryKey: ['copy-positions'],
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
 * Hook to start copying a trader
 *
 * Features:
 * - Automatic balance cache invalidation on success
 * - Toast notifications for success/error
 * - Loading and error states
 * - Transaction and position history invalidation
 *
 * @returns Mutation object with mutate, mutateAsync, isPending, error, etc.
 *
 * @example
 * ```tsx
 * const startCopyMutation = useStartCopyTrade();
 *
 * const handleStartCopy = async () => {
 *   try {
 *     const result = await startCopyMutation.mutateAsync({
 *       traderId: 'trader-123',
 *       amount: 5000
 *     });
 *     console.log('Copy trade started:', result);
 *   } catch (error) {
 *     console.error('Failed to start:', error);
 *   }
 * };
 * ```
 */
export function useStartCopyTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CopyTradeStartRequest) =>
      postJson<CopyTradeStartResponse>('/api/copy-trade/start', request, 'Failed to start copying'),
    onSuccess: (data) => {
      invalidateCopyTradeQueries(queryClient);

      // Success toast notification
      toast.success('Copy Trading Started', {
        description: data.message || `Successfully started copying ${data.position.trader.name}`,
      });
    },
    onError: (error: Error) => {
      // Error toast notification
      toast.error('Failed to Start Copy Trading', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to stop copying - closes the position and credits the wallet
 */
export function useStopCopyTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) =>
      postJson<{ message: string }>('/api/copy-trade/stop', { positionId }, 'Failed to stop copying'),
    onSuccess: (data) => {
      invalidateCopyTradeQueries(queryClient);
      toast.success(data.message || 'Stopped copying');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to join a full trader's waitlist
 */
export function useJoinWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (traderId: string) =>
      postJson<{ message: string }>('/api/copy-trade/waitlist/join', { traderId }, 'Failed to join waitlist'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['traders'] });
      toast.success(data.message || 'Joined waitlist');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to leave a trader's waitlist
 */
export function useLeaveWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (traderId: string) =>
      postJson<{ message: string }>('/api/copy-trade/waitlist/leave', { traderId }, 'Failed to leave waitlist'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traders'] });
      toast.success('Left waitlist successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

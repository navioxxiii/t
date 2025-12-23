/**
 * TanStack Query Hooks for Copy Trading Operations
 * Provides mutation hooks for starting/stopping copy trading with automatic cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    mutationFn: async (request: CopyTradeStartRequest): Promise<CopyTradeStartResponse> => {
      const response = await fetch('/api/copy-trade/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start copying');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate ALL balance-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] }); // Backward compatibility

      // Also invalidate copy-trade related queries
      queryClient.invalidateQueries({ queryKey: ['copy-positions'] });
      queryClient.invalidateQueries({ queryKey: ['traders'] }); // Trader stats might change

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

/**
 * TanStack Query Hook for Earn Investment Operations
 * Provides mutation hook for investing in earn vaults with automatic cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EarnInvestRequest {
  vaultId: string;
  amount: number;
}

export interface EarnInvestResponse {
  success: boolean;
  position: {
    id: string;
    user_id: string;
    vault_id: string;
    amount_usdt: number;
    daily_profit_rate: number;
    total_profit_usdt: number;
    status: string;
    matures_at: string;
    vault: {
      id: string;
      title: string;
      subtitle: string;
      apy_percent: number;
      duration_months: number;
    };
  };
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to invest in an earn vault
 *
 * Features:
 * - Automatic balance cache invalidation on success
 * - Toast notifications for success/error
 * - Loading and error states
 * - Transaction history invalidation
 *
 * @returns Mutation object with mutate, mutateAsync, isPending, error, etc.
 *
 * @example
 * ```tsx
 * const investMutation = useEarnInvest();
 *
 * const handleInvest = async () => {
 *   try {
 *     const result = await investMutation.mutateAsync({
 *       vaultId: 'vault-123',
 *       amount: 1000
 *     });
 *     console.log('Investment successful:', result);
 *   } catch (error) {
 *     console.error('Investment failed:', error);
 *   }
 * };
 * ```
 */
export function useEarnInvest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: EarnInvestRequest): Promise<EarnInvestResponse> => {
      const response = await fetch('/api/earn/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Investment failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate ALL balance-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] }); // Backward compatibility

      // Also invalidate user's earn positions
      queryClient.invalidateQueries({ queryKey: ['earn-positions'] });

      // Success toast notification
      toast.success('Investment Successful', {
        description: data.message || `Successfully invested ${data.position.amount_usdt} USDT`,
      });
    },
    onError: (error: Error) => {
      // Error toast notification
      toast.error('Investment Failed', {
        description: error.message,
      });
    },
  });
}

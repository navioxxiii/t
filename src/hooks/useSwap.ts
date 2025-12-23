import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { calculateSwapEstimate, type SwapEstimate } from '@/lib/binance/swap';

interface SwapRequest {
  fromCoin: string;
  toCoin: string;
  fromAmount: number;
  estimate: SwapEstimate;
}

interface SwapResponse {
  success: boolean;
  transaction: unknown;
  estimate: SwapEstimate;
  newBalances: {
    [key: string]: number;
  };
}

/**
 * Hook to execute a swap
 */
export function useSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SwapRequest): Promise<SwapResponse> => {
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Swap failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate ALL balance-related queries to refetch updated balances
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * Hook to get swap estimate (real-time)
 */
export function useSwapEstimate(
  fromCoin: string | undefined,
  toCoin: string | undefined,
  fromAmount: number | undefined
) {
  return useQuery({
    queryKey: ['swap-estimate', fromCoin, toCoin, fromAmount],
    queryFn: async () => {
      if (!fromCoin || !toCoin || !fromAmount || fromAmount <= 0) {
        return null;
      }
      return calculateSwapEstimate(fromCoin, toCoin, fromAmount);
    },
    enabled: !!fromCoin && !!toCoin && !!fromAmount && fromAmount > 0,
    staleTime: 10 * 1000, // Consider stale after 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
    retry: 2,
  });
}

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import type { SwapEstimate } from '@/lib/binance/swap';

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
      // Quote from the server - the same pricing the swap is credited at
      const params = new URLSearchParams({ from: fromCoin, to: toCoin, amount: String(fromAmount) });
      const response = await fetch(`/api/swap/quote?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to get a quote');
      }
      return data.quote as SwapEstimate;
    },
    enabled: !!fromCoin && !!toCoin && !!fromAmount && fromAmount > 0,
    staleTime: 10 * 1000, // Consider stale after 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
    retry: 2,
  });
}

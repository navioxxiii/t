/**
 * TanStack Query hooks for Staking
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { StakingAsset, StakingPosition } from '@/types/staking';
import { STAKING_ENABLED } from '@/lib/feature-flags';

async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function invalidateStaking(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['balances'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['staking-positions'] });
  queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
}

export function useStakingAssets() {
  return useQuery({
    queryKey: ['staking-assets'],
    queryFn: async () => (await api<{ assets: StakingAsset[] }>('/api/staking/assets')).assets,
    staleTime: 5 * 60 * 1000,
    enabled: STAKING_ENABLED,
  });
}

export function useStakingPositions() {
  return useQuery({
    queryKey: ['staking-positions'],
    queryFn: async () => (await api<{ positions: StakingPosition[] }>('/api/staking/positions')).positions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: STAKING_ENABLED,
  });
}

export function useStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { baseTokenId: number; amount: number }) => api('/api/staking/stake', request),
    onSuccess: () => {
      invalidateStaking(queryClient);
      toast.success('Staked successfully', { description: 'Rewards start from the first full day of staking.' });
    },
    onError: (error: Error) => toast.error('Stake failed', { description: error.message }),
  });
}

export function useUnstake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) =>
      api<{ available_at: string; unbonding_days: number }>('/api/staking/unstake', { positionId }),
    onSuccess: (data) => {
      invalidateStaking(queryClient);
      toast.success(
        data.unbonding_days > 0 ? 'Unstaking started' : 'Unstaked',
        {
          description:
            data.unbonding_days > 0
              ? `Your coins return to your balance on ${new Date(data.available_at).toLocaleDateString()}.`
              : 'Your coins are back in your balance.',
        }
      );
    },
    onError: (error: Error) => toast.error('Unstake failed', { description: error.message }),
  });
}

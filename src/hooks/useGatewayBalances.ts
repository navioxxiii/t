/**
 * Gateway Balances Hook
 * Fetch admin gateway balance data (manual refresh only)
 */

import { useQuery } from '@tanstack/react-query';

export interface PlisioBalanceItem {
  currency: string;
  psys_cid: string;
  balance: string;
  usdValue?: number;
}

export interface NowPaymentsBalanceItem {
  currency: string;
  amount: string;
  pendingAmount: string;
  usdValue?: number;
}

export interface GatewaySection<T> {
  configured: boolean;
  balances: T[];
  error?: string;
}

export interface GatewayBalancesResponse {
  plisio: GatewaySection<PlisioBalanceItem>;
  nowpayments: GatewaySection<NowPaymentsBalanceItem>;
  prices: Record<string, number>;
  totalUsd: number | null;
  fetchedAt: string;
}

async function fetchGatewayBalances(): Promise<GatewayBalancesResponse> {
  const response = await fetch('/api/admin/gateway-balances');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch gateway balances');
  }

  return response.json();
}

export function useGatewayBalances() {
  return useQuery({
    queryKey: ['gateway-balances'],
    queryFn: fetchGatewayBalances,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: Infinity, // Never auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

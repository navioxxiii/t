/**
 * Transaction Statistics Hook
 * Fetch admin transaction statistics
 */

import { useQuery } from '@tanstack/react-query';

export interface TransactionStats {
  todayTransactions: number;
  todayVolume: string;
  pendingTransactions: number;
  failedTransactions: number;
}

async function fetchTransactionStats(): Promise<TransactionStats> {
  const response = await fetch('/api/admin/transactions/stats');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transaction stats');
  }

  return response.json();
}

export function useTransactionStats() {
  return useQuery({
    queryKey: ['transaction-stats'],
    queryFn: fetchTransactionStats,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

/**
 * useDepositPayment Hook
 * Manages invoice-style deposit payment lifecycle for memo-based currencies (XRP, XLM)
 *
 * Features:
 * - Create new deposit payments
 * - Poll for status updates
 * - Countdown timer for expiry
 * - Auto-stop polling on completion/expiry
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface DepositPayment {
  id: string;
  payment_id: string;
  address: string;
  extra_id: string | null;
  expected_amount: number;
  expected_amount_usd?: number;
  currency: string;
  symbol: string;
  status: string;
  actually_paid?: number;
  actually_paid_fiat?: number;
  tx_hash?: string;
  expires_at: string;
  expires_in_seconds: number;
  is_expired?: boolean;
  is_minimum_amount?: boolean;
  minimum_amount_usd?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepositParams {
  base_token_id: number;
  amount_usd?: number;
}

interface CreateDepositResponse {
  success: boolean;
  deposit: DepositPayment;
}

interface GetDepositResponse {
  deposit: DepositPayment;
}

interface ActiveDepositResponse {
  deposit: DepositPayment | null;
}

/**
 * Create a new deposit payment
 */
async function createDepositPayment(
  params: CreateDepositParams
): Promise<DepositPayment> {
  const response = await fetch('/api/deposits/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create deposit payment');
  }

  return (data as CreateDepositResponse).deposit;
}

/**
 * Get deposit payment status
 */
async function getDepositPayment(
  id: string,
  refresh = false
): Promise<DepositPayment> {
  const url = `/api/deposits/${id}${refresh ? '?refresh=true' : ''}`;
  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get deposit payment');
  }

  return (data as GetDepositResponse).deposit;
}

/**
 * Fetch active (non-expired, non-terminal) deposit for a token
 */
async function fetchActiveDeposit(
  baseTokenId: number
): Promise<DepositPayment | null> {
  const response = await fetch(`/api/deposits/active?base_token_id=${baseTokenId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch active deposit');
  }

  return (data as ActiveDepositResponse).deposit;
}

/**
 * Terminal statuses that stop polling
 */
const TERMINAL_STATUSES = ['finished', 'expired', 'failed', 'refunded'];

/**
 * Hook to create a deposit payment
 */
export function useCreateDepositPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepositPayment,
    onSuccess: (deposit) => {
      // Cache the deposit
      queryClient.setQueryData(['deposit-payment', deposit.id], deposit);
    },
  });
}

/**
 * Hook to fetch deposit payment status with optional polling
 */
export function useDepositPaymentStatus(
  depositId: string | null,
  options: {
    pollInterval?: number;
    enabled?: boolean;
  } = {}
) {
  const { pollInterval = 5000, enabled = true } = options;

  return useQuery({
    queryKey: ['deposit-payment', depositId],
    queryFn: () => getDepositPayment(depositId!, true),
    enabled: enabled && !!depositId,
    refetchInterval: (query) => {
      // Stop polling if terminal status
      const data = query.state.data;
      if (data && TERMINAL_STATUSES.includes(data.status)) {
        return false;
      }
      return pollInterval;
    },
    staleTime: 0, // Always consider stale for polling
  });
}

/**
 * Main hook to manage full deposit payment lifecycle
 *
 * @param baseTokenId - The base token ID to create deposits for
 * @returns Deposit management state and functions
 */
export function useDepositPayment(baseTokenId: number) {
  const [currentDeposit, setCurrentDeposit] = useState<DepositPayment | null>(
    null
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Fetch any existing active deposit on mount
  const activeDepositQuery = useQuery({
    queryKey: ['active-deposit', baseTokenId],
    queryFn: () => fetchActiveDeposit(baseTokenId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Initialize currentDeposit from active deposit if exists (only once)
  useEffect(() => {
    if (!hasInitialized && !activeDepositQuery.isLoading) {
      if (activeDepositQuery.data) {
        setCurrentDeposit(activeDepositQuery.data);
      }
      setHasInitialized(true);
    }
  }, [activeDepositQuery.data, activeDepositQuery.isLoading, hasInitialized]);

  // Create mutation
  const createMutation = useCreateDepositPayment();

  // Status polling query
  const statusQuery = useDepositPaymentStatus(currentDeposit?.id || null, {
    enabled: !!currentDeposit && !TERMINAL_STATUSES.includes(currentDeposit.status),
    pollInterval: 5000,
  });

  // Update current deposit from poll results
  useEffect(() => {
    if (statusQuery.data) {
      setCurrentDeposit(statusQuery.data);
    }
  }, [statusQuery.data]);

  // Countdown timer
  useEffect(() => {
    if (!currentDeposit?.expires_at) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(currentDeposit.expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(remaining);

      // Mark as expired locally if time is up
      if (remaining <= 0 && currentDeposit.status === 'waiting') {
        setCurrentDeposit((prev) =>
          prev ? { ...prev, status: 'expired', is_expired: true } : null
        );
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentDeposit?.expires_at, currentDeposit?.status]);

  // Create new deposit
  const createDeposit = useCallback(
    async (amountUsd?: number) => {
      try {
        const deposit = await createMutation.mutateAsync({
          base_token_id: baseTokenId,
          amount_usd: amountUsd,
        });
        setCurrentDeposit(deposit);
        return deposit;
      } catch (error) {
        throw error;
      }
    },
    [baseTokenId, createMutation]
  );

  // Reset state
  const reset = useCallback(() => {
    setCurrentDeposit(null);
    setSecondsRemaining(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Refresh status manually
  const refreshStatus = useCallback(async () => {
    if (!currentDeposit?.id) return;
    try {
      const updated = await getDepositPayment(currentDeposit.id, true);
      setCurrentDeposit(updated);
      queryClient.setQueryData(['deposit-payment', currentDeposit.id], updated);
    } catch (error) {
      console.error('Failed to refresh deposit status:', error);
    }
  }, [currentDeposit?.id, queryClient]);

  // Invalidate balances on success
  useEffect(() => {
    if (currentDeposit?.status === 'finished') {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    }
  }, [currentDeposit?.status, queryClient]);

  return {
    // State
    deposit: currentDeposit,
    secondsRemaining,
    isCreating: createMutation.isPending,
    isPolling: statusQuery.isFetching,
    isLoadingActive: activeDepositQuery.isLoading,
    error: createMutation.error || statusQuery.error,

    // Computed
    isTerminal: currentDeposit
      ? TERMINAL_STATUSES.includes(currentDeposit.status)
      : false,
    isWaiting: currentDeposit?.status === 'waiting',
    isConfirming:
      currentDeposit?.status === 'confirming' ||
      currentDeposit?.status === 'confirmed',
    isFinished: currentDeposit?.status === 'finished',
    isExpired:
      currentDeposit?.status === 'expired' || currentDeposit?.is_expired,

    // Actions
    createDeposit,
    reset,
    refreshStatus,
  };
}

/**
 * Format seconds to MM:SS display
 */
export function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

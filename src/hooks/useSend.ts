/**
 * TanStack Query Hooks for Send (Withdrawal) Operations
 * Provides hooks for fee estimation and send requests
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types
export interface FeeEstimateRequest {
  coinSymbol: string;
  toAddress: string;
  amount: string;
}

export interface SendRequest {
  deploymentSymbol: string;
  toAddress: string;
  amount: string;
  estimatedFee?: string;
}

export interface SendResponse {
  success: boolean;
  message: string;
  transaction: {
    id: string;
    status: string;
    amount: string;
    coinSymbol: string;
    toAddress: string;
  };
  request: {
    id: string;
    status: string;
  };
}

/**
 * Fetch fee estimate from API
 */
async function fetchFeeEstimate(data: FeeEstimateRequest): Promise<unknown> {
  const response = await fetch('/api/send/estimate-fee', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to estimate fee');
  }

  return response.json();
}

/**
 * Submit send request to API
 */
async function submitSendRequest(data: SendRequest): Promise<SendResponse> {
  const response = await fetch('/api/send/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit send request');
  }

  return response.json();
}

/**
 * Hook to estimate network fee
 *
 * Only runs when all parameters are provided
 * Auto-refetches when params change
 *
 * @param params Fee estimation parameters
 * @returns Query result with fee estimate
 */
export function useFeeEstimate(params: FeeEstimateRequest | null) {
  return useQuery({
    queryKey: ['feeEstimate', params],
    queryFn: () => fetchFeeEstimate(params!),
    enabled: !!params && !!params.coinSymbol && !!params.toAddress && !!params.amount,
    retry: 2,
    staleTime: 30000, // Fee estimates are valid for 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create a send request (mutation)
 *
 * Features:
 * - Invalidates transaction and wallet queries on success
 * - Returns loading/error states
 * - Optimistic updates possible
 *
 * @returns Mutation object
 */
export function useCreateSendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitSendRequest,
    onSuccess: () => {
      // Invalidate and refetch ALL balance-related queries
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (error) => {
      console.error('Send request failed:', error);
    },
  });
}

/**
 * Helper hook to validate address format
 * (Client-side validation before API call)
 */
export function useAddressValidation() {
  const validateAddress = (coinSymbol: string, address: string): boolean => {
    if (!address || address.length === 0) return false;

    // Basic validation patterns (simplified)
    const patterns: Record<string, RegExp> = {
      BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      USDT: /^T[a-zA-Z0-9]{33}$/, // TRC-20
      DOGE: /^D[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
      TRX: /^T[a-zA-Z0-9]{33}$/,
      LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
      SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Solana Base58
    };

    const pattern = patterns[coinSymbol];
    if (!pattern) {
      // Fallback: Try EVM format for unknown tokens (BNB, USDC, BUSD, etc.)
      // This covers all EVM-compatible chains: BSC, Base, Ethereum
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    return pattern.test(address);
  };

  return { validateAddress };
}

/**
 * Helper to calculate total amount (amount + fee)
 */
export function calculateTotal(amount: string, fee: string): string {
  try {
    const total = parseFloat(amount) + parseFloat(fee || '0');
    return total.toFixed(8); // 8 decimals for crypto
  } catch {
    return amount;
  }
}

/**
 * Helper to check if user has sufficient balance
 */
export function checkSufficientBalance(
  balance: string | number,
  amount: string,
  feeInUsd: string = '0',
  priceInUsd: number | null | undefined
): boolean {
  try {
    const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
    const amountNum = parseFloat(amount);
    const feeInUsdNum = parseFloat(feeInUsd);

    // If any values are not a number, fail validation
    if (isNaN(balanceNum) || isNaN(amountNum) || isNaN(feeInUsdNum)) {
      return false;
    }

    // If there's a fee, we must have the price to convert it
    // A price of 0 would cause division by zero
    if (feeInUsdNum > 0 && (!priceInUsd || priceInUsd <= 0)) {
      // Cannot determine if balance is sufficient without a price, so be pessimistic
      return false;
    }

    // Convert the USD fee to its equivalent in the crypto currency
    const feeInCrypto = feeInUsdNum > 0 && priceInUsd ? feeInUsdNum / priceInUsd : 0;
    const totalCostInCrypto = amountNum + feeInCrypto;

    return balanceNum >= totalCostInCrypto;
  } catch {
    return false;
  }
}

/**
 * React Query hooks for token preferences (new centralized system)
 * Manages user's token visibility preferences for base_tokens
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseToken } from '@/types/balance';

/**
 * Extended token preference type with full base_token details
 */
export interface TokenPreference {
  id: number | null;
  user_id: string;
  base_token_id: number;
  is_visible: boolean;
  sort_order: number;
  base_tokens: {
    id: number;
    code: string;
    symbol: string;
    name: string;
    logo_url: string;
    token_type?: string;
    is_stablecoin?: boolean;
    decimals?: number;
  };
}

/**
 * Hook to fetch all active base tokens (public data)
 * Used for reference when displaying available tokens
 */
export function useBaseTokens() {
  return useQuery({
    queryKey: ['base-tokens'],
    queryFn: async () => {
      const res = await fetch('/api/base-tokens');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch base tokens');
      }
      const data = await res.json();
      return data.tokens as BaseToken[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user's token preferences
 * Returns all active base tokens with user's visibility preference
 * Defaults to is_visible: true if no preference exists
 */
export function useTokenPreferences() {
  return useQuery({
    queryKey: ['token-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/token-preferences');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch preferences');
      }
      const data = await res.json();
      return data.preferences as TokenPreference[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to toggle a single token's visibility
 * Uses optimistic updates for instant feedback
 */
export function useToggleTokenVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      baseTokenId,
      isVisible,
    }: {
      baseTokenId: number;
      isVisible: boolean;
    }) => {
      const res = await fetch('/api/user/token-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_token_id: baseTokenId, is_visible: isVisible }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update preference');
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['token-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'visible'] });

      // Silent auto-generation: When token is toggled ON, silently generate deposit addresses in background
      // This ensures addresses are ready when user clicks receive
      // Fire-and-forget - no loading states or error handling to keep UX clean
      // Only generates for THIS specific base token's deployments
      if (variables.isVisible) {
        fetch(`/api/wallets/generate?base_token_id=${variables.baseTokenId}`, {
          method: 'POST'
        }).catch(() => {});
      }
    },
  });
}

/**
 * Hook to get tokens with non-zero balances
 * Combines token preferences with balance data for filtering
 */
export function useTokensWithBalances() {
  const { data: preferences, ...rest } = useTokenPreferences();

  // You can extend this to filter by balances in the future
  // For now, it just returns all preferences
  return {
    data: preferences,
    ...rest,
  };
}

import { useEffect } from 'react';
import { create } from 'zustand';
import type { BaseToken } from '@/types/balance';

interface TokenState {
  baseTokens: BaseToken[];
  isLoading: boolean;
  error: string | null;
  fetchBaseTokens: () => Promise<void>;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  baseTokens: [],
  isLoading: false,
  error: null,

  fetchBaseTokens: async () => {
    if (get().baseTokens.length > 0 || get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/base-tokens');
      if (!res.ok) throw new Error('Failed to fetch base tokens');
      const data = await res.json();
      set({ baseTokens: data.tokens, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
    }
  },
}));

/**
 * Base tokens, loaded on first use. Components don't depend on a parent page
 * having fetched them; concurrent callers share one request via the store guard.
 */
export function useBaseTokens() {
  const baseTokens = useTokenStore((state) => state.baseTokens);
  const isLoading = useTokenStore((state) => state.isLoading);
  const error = useTokenStore((state) => state.error);
  const fetchBaseTokens = useTokenStore((state) => state.fetchBaseTokens);

  useEffect(() => {
    fetchBaseTokens();
  }, [fetchBaseTokens]);

  return { baseTokens, isLoading, error };
}

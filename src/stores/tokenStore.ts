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

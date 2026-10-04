import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Privacy preferences - "hide balances" masks the user's amounts and values
 * across the wallet, and is remembered between visits.
 */
interface PrivacyState {
  hideBalances: boolean;
  toggleHideBalances: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      hideBalances: false,
      toggleHideBalances: () => set((state) => ({ hideBalances: !state.hideBalances })),
    }),
    {
      name: 'privacy-preferences',
      // createJSONStorage swallows storage errors (private mode, blocked storage)
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Mask for hidden amounts */
export const HIDDEN_VALUE = '••••';

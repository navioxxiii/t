'use client';

import { useEffect } from 'react';
import { useAuthStore, useAuthPeriodicRefresh } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

export function StoreInitializer() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const authInitialized = useAuthStore((state) => state.authInitialized);

  // Initialize auth once on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Setup periodic profile refresh
  useAuthPeriodicRefresh();

  // Initialize chat ONLY after auth is ready and user is authenticated
  useEffect(() => {
    if (!authInitialized || !user || !profile) return;

    useChatStore.getState().fetchActiveTicket();

    return () => {
      useChatStore.getState().cleanup();
    };
  }, [authInitialized, user, profile]);

  return null;
}

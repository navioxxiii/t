'use client';

import { useAuthStore } from '@/stores/authStore';

// Hook to get current user
export function useUser() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  return { user, loading };
}

// Hook to get current profile
export function useProfile() {
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  return { profile, loading };
}

// Hook to check if user is admin
export function useIsAdmin() {
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  return { isAdmin, loading };
}

// Hook to check if user is super admin
export function useIsSuperAdmin() {
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const isSuperAdmin = profile?.role === 'super_admin';
  return { isSuperAdmin, loading };
}

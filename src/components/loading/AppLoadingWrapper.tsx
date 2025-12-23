/**
 * App Loading Wrapper
 * Shows splash screen while app is initializing
 */

'use client';

import { useAuthStore } from '@/stores/authStore';
import { SplashScreen } from './SplashScreen';

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

export function AppLoadingWrapper({ children }: AppLoadingWrapperProps) {
  const loading = useAuthStore((state) => state.loading);

  return (
    <>
      <SplashScreen isLoading={loading} />
      {children}
    </>
  );
}

'use client';

import { ReactNode } from 'react';
import { AppLoadingWrapper } from '@/components/loading/AppLoadingWrapper';
import { OfflineIndicator } from '@/components/network/OfflineIndicator';
import { PWAInitializer } from '@/components/pwa/PWAInitializer';
import { StoreInitializer } from '@/components/layout/StoreInitializer';
import { ViewportProvider } from '@/providers/ViewportProvider';
import { Toaster } from '@/components/ui/sonner';

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreInitializer />
      <ViewportProvider />
      <AppLoadingWrapper>
        <OfflineIndicator />
        <PWAInitializer />
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#181a20",
              border: "1px solid #2b3139",
              color: "#eaecef",
              fontWeight: "500",
            },
            className: "toast-enhanced",
          }}
        />
      </AppLoadingWrapper>
    </>
  );
}

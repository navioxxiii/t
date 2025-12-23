'use client';

import { useEffect } from 'react';
import { branding } from '@/config/branding';
import { PWAInstallButton } from './PWAInstallButton';

const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const SW_PATH = '/sw.js';

export function PWAInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers are not supported in this browser.');
      return;
    }

    const isSecureContext =
      window.location.protocol === 'https:' || LOCALHOSTS.has(window.location.hostname);

    if (!isSecureContext) {
      console.warn('[PWA] Service worker registration skipped (insecure context).');
      return;
    }

    let mounted = true;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: branding.urls.scope || '/',
        });

        if (!mounted) return;

        console.info('[PWA] Service worker registered:', registration.scope);
      } catch (error) {
        console.error('[PWA] Failed to register service worker:', error);
      }
    };

    registerServiceWorker();

    const handleAppInstalled = () => {
      console.info('[PWA] App installed');
      // Clear the dismissed flags so button doesn't show again
      localStorage.removeItem('pwa-install-dismissed'); // Old flag (legacy)
      localStorage.removeItem('pwa-install-dismissed-at'); // New timestamp-based flag
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mounted = false;
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return <PWAInstallButton />;
}


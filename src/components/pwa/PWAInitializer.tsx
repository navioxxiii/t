'use client';

import { useEffect } from 'react';
import { branding } from '@/config/branding';
import { initInstallCapture } from '@/lib/pwa/install';

const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const SW_PATH = '/sw.js';

export function PWAInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Capture the install prompt early; the banner (dashboard) and Settings read it later
    initInstallCapture();

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

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}


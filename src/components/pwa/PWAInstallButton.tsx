/**
 * PWA Install Button
 * One-tap install for Android, guided install for iOS
 *
 * Features:
 * - Only shows on dashboard pages (not admin, landing, etc.)
 * - Respects already-installed state
 * - 1-month dismiss period (not permanent)
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { IOSInstallGuide } from './IOSInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Routes where banner should NOT show
const EXCLUDED_ROUTES = [
  '/admin',
  '/login',
  '/register',
  '/verify-email',
  '/reset-password',
  '/', // Landing page
];

export function PWAInstallButton() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );

  // Check if current route is excluded
  const isExcludedRoute = EXCLUDED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (isStandalone) {
      console.info('[PWA Install] Already installed (standalone mode)');
      return;
    }

    // Don't show on excluded routes
    if (isExcludedRoute) {
      console.info('[PWA Install] Excluded route:', pathname);
      return;
    }

    // Check if user dismissed and if dismiss has expired
    const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');
    if (dismissedAt) {
      const dismissTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const timeSinceDismiss = now - dismissTime;

      if (timeSinceDismiss < DISMISS_DURATION) {
        const daysRemaining = Math.ceil((DISMISS_DURATION - timeSinceDismiss) / (24 * 60 * 60 * 1000));
        console.info(`[PWA Install] Dismissed (${daysRemaining} days remaining)`);
        return;
      } else {
        // Dismiss period expired, clear it
        console.info('[PWA Install] Dismiss period expired, showing banner again');
        localStorage.removeItem('pwa-install-dismissed-at');
      }
    }

    // Android/Chrome: wait for native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show button after 30s even if no prompt (iOS + some browsers)
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 30_000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [isStandalone, isExcludedRoute, pathname]);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowButton(false);
    // Store dismiss timestamp (not permanent - expires in 30 days)
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
    console.info('[PWA Install] Dismissed for 30 days');
  };

  if (!showButton) return null;

  return (
    <>
      <div className="fixed bottom-[88px] md:bottom-[104px] left-4 right-4 z-[110] animate-in slide-in-from-bottom-5 pb-safe max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl shadow-2xl p-4 flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">Install Crypto Wallet</h3>
            <p className="text-white/80 text-xs">
              {isIOS ? 'Add to Home Screen for quick access' : 'Install for offline use & faster loading'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-white text-brand-primary hover:bg-white/90 font-bold shadow-lg"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <IOSInstallGuide
        open={showIOSGuide}
        onOpenChange={setShowIOSGuide}
        onDismissPermanently={handleDismiss}
      />
    </>
  );
}
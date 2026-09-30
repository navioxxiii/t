/**
 * PWA Install Banner
 * One-tap install on supporting browsers, guided install on iOS
 *
 * Shown sparingly so it helps rather than nags:
 * - Only on the wallet home, and only to browsers that can actually install
 * - Only after a few sessions, and after the user has been on the page a while
 * - Backs off after each dismissal (14 days, then 60 days, then never)
 * - Always available on demand from Settings → Install app
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Download } from 'lucide-react';
import { branding } from '@/config/branding';
import { Button } from '@/components/ui/button';
import {
  isBannerDue,
  promptInstall,
  recordDismissal,
  recordSession,
  useInstallPlatform,
} from '@/lib/pwa/install';
import { IOSInstallGuide } from './IOSInstallGuide';

// Allow-list: new pages never get the banner by default
const BANNER_ROUTES = ['/dashboard'];
// Let people settle in before asking
const DWELL_MS = 15_000;

export function PWAInstallButton() {
  const pathname = usePathname();
  const platform = useInstallPlatform();
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const onAllowedPage = BANNER_ROUTES.includes(pathname);

  // Count this session toward engagement
  useEffect(() => {
    recordSession();
  }, []);

  useEffect(() => {
    if (!platform || !onAllowedPage || !isBannerDue()) return;
    const timer = setTimeout(() => setVisible(true), DWELL_MS);
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [platform, onAllowedPage]);

  const handleDismiss = () => {
    setVisible(false);
    recordDismissal();
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true);
      return;
    }
    // Declining the browser dialog is recorded as a dismissal inside promptInstall
    setVisible(false);
    await promptInstall();
  };

  if (!visible || !platform || !onAllowedPage) {
    return (
      <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} onDismissPermanently={handleDismiss} />
    );
  }

  return (
    <>
      <div className="fixed bottom-[88px] md:bottom-[104px] left-4 right-4 z-[110] animate-in slide-in-from-bottom-5 pb-safe max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl shadow-2xl p-4 flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">Install {branding.name.full}</h3>
            <p className="text-white/80 text-xs">
              {platform === 'ios' ? 'Add to Home Screen for quick access' : 'Install for offline use & faster loading'}
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
            <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1" aria-label="Dismiss">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} onDismissPermanently={handleDismiss} />
    </>
  );
}

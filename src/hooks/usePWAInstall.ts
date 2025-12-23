/**
 * PWA Installation Hook
 * Handles PWA installation prompts and iOS modal
 */

'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  isInBrowser: boolean;
  showIOSModal: boolean;
  showInstructionsModal: boolean;
  canInstall: boolean;
  debugInfo: {
    hasServiceWorker: boolean;
    hasManifest: boolean;
    isHttps: boolean;
    hasBeforeInstallPromptSupport: boolean;
  };
  openIOSModal: () => void;
  closeIOSModal: () => void;
  openInstructionsModal: () => void;
  closeInstructionsModal: () => void;
  promptInstall: () => Promise<void>;
}

export function usePWAInstall(): PWAInstallState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    hasServiceWorker: false,
    hasManifest: false,
    isHttps: false,
    hasBeforeInstallPromptSupport: false,
  });

  // Production ready: Check PWA readiness
  const getPWAReadinessInfo = (): { isReady: boolean; debugInfo: typeof debugInfo } => {
    if (typeof window === 'undefined') {
      return { isReady: false, debugInfo };
    }

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasManifest = Boolean(document.querySelector('link[rel="manifest"], link[rel="manifest.webmanifest"]'));
    const isHttps = window.location.protocol === 'https:' ||
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';
    const hasBeforeInstallPromptSupport = 'onbeforeinstallprompt' in window;
    const isNotStandalone = !window.matchMedia('(display-mode: standalone)').matches &&
                           !(navigator as Navigator & { standalone?: boolean }).standalone;

    const debug = {
      hasServiceWorker: hasServiceWorker,
      hasManifest: hasManifest,
      isHttps: isHttps,
      hasBeforeInstallPromptSupport: hasBeforeInstallPromptSupport,
    };

    const isReady = hasServiceWorker && hasManifest && isHttps && hasBeforeInstallPromptSupport && isNotStandalone;

    return { isReady, debugInfo: debug };
  };

  useEffect(() => {
    // Production ready: Check PWA readiness and log requirements
    const { isReady, debugInfo: readinessInfo } = getPWAReadinessInfo();

    // Update debug info state asynchronously
    setTimeout(() => setDebugInfo(readinessInfo), 0);

    if (!isReady) {
      console.warn('[PWA] Requirements not met for installation:');
      console.warn('- Service Worker:', readinessInfo.hasServiceWorker ? '✓' : '✗');
      console.warn('- Web App Manifest:', readinessInfo.hasManifest ? '✓' : '✗');
      console.warn('- HTTPS/Secure Context:', readinessInfo.isHttps ? '✓' : '✗');
      console.warn('- BeforeInstallPrompt Support:', readinessInfo.hasBeforeInstallPromptSupport ? '✓' : '✗');
      return;
    }

    console.log('[PWA] Requirements met, listening for install prompt');

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault();
      // Save the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      // Production ready: Show appropriate fallback based on platform
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/i.test(userAgent);

      if (isIOS) {
        // iOS: Use custom modal with share instructions
        setShowIOSModal(true);
      } else if (isAndroid) {
        // Android: Show manual installation instructions
        setShowInstructionsModal(true);
      } else {
        // Desktop/other: Show general instructions
        setShowInstructionsModal(true);
      }
      return;
    }

    // Show the install prompt
    try {
      await installPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted');
        setInstallPrompt(null);
      } else {
        console.log('[PWA] Installation dismissed');
        // Allow user to try again, but log it for analytics
      }
    } catch (error) {
      console.error('[PWA] Installation error:', error);
      setShowInstructionsModal(true);
    }
  };

  const isInBrowser = typeof window !== 'undefined' && !window.matchMedia('(display-mode: standalone)').matches && !((navigator as Navigator & { standalone?: boolean }).standalone === true);
  const isStandalone = !isInBrowser;
  const canInstall = installPrompt !== null || (isInBrowser && debugInfo.isHttps && debugInfo.hasServiceWorker);

  const openIOSModal = () => {
    setShowIOSModal(true);
  };

  const closeIOSModal = () => {
    setShowIOSModal(false);
  };

  const openInstructionsModal = () => {
    setShowInstructionsModal(true);
  };

  const closeInstructionsModal = () => {
    setShowInstructionsModal(false);
  };

  return {
    isInstallable: canInstall,
    isStandalone,
    isInBrowser,
    showIOSModal,
    showInstructionsModal,
    canInstall,
    debugInfo,
    openIOSModal,
    closeIOSModal,
    openInstructionsModal,
    closeInstructionsModal,
    promptInstall,
  };
}

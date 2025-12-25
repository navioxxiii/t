/**
 * Animated Splash Screen
 * Shows on initial app load with animated logo (Binance-style)
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { branding } from '@/config/branding';

interface SplashScreenProps {
  /**
   * Whether the app is still loading
   */
  isLoading: boolean;
}

export function SplashScreen({ isLoading }: SplashScreenProps) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Ensure splash shows for minimum duration
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1000); // Minimum 1 second

    // Force hide after maximum time
    const maxTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShow(false), 500);
    }, 5000); // Maximum 5 seconds

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    // Only hide when both loading is done AND minimum time has elapsed
    if (!isLoading && minTimeElapsed && show) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 100); // Small delay for smooth transition

      const hideTimer = setTimeout(() => {
        setShow(false);
      }, 600); // Match animation duration + buffer
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isLoading, minTimeElapsed, show]);

  // Don't render if we've finished hiding
  if (!show) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-bg-primary transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated Logo */}
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="animate-splash-pulse">
          <Image
            src="/icons/brand/icon-192.png"
            alt={branding.name.full}
            width={120}
            height={120}
            priority
            className="drop-shadow-glow"
          />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-primary">
            {branding.name.short}
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Secure. Simple. Powerful.
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-splash-dot" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-splash-dot" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-splash-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

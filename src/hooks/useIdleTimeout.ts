/**
 * Idle Timeout Hook
 * Tracks user activity and triggers callback after configured idle period
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   */
  timeout: number;

  /**
   * Callback fired when user becomes idle
   */
  onIdle: () => void;

  /**
   * Whether idle detection is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Events to listen for activity
   * @default ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
   */
  events?: string[];

  /**
   * Accelerated timeout when app goes to background (milliseconds)
   * Used for visibility change detection (tab switch, app switch on mobile PWA)
   * @default 30000 (30 seconds)
   */
  backgroundTimeout?: number;
}

/**
 * Hook to detect user idle state based on activity
 *
 * @example
 * ```tsx
 * useIdleTimeout({
 *   timeout: 5 * 60 * 1000, // 5 minutes
 *   onIdle: () => lockApp(),
 *   enabled: isAuthenticated,
 *   backgroundTimeout: 30 * 1000, // 30 seconds when backgrounded
 * });
 * ```
 */
export function useIdleTimeout({
  timeout,
  onIdle,
  enabled = true,
  events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'],
  backgroundTimeout = 30000, // 30 seconds default
}: UseIdleTimeoutOptions) {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);
  const isBackgroundedRef = useRef(false);

  // Keep onIdle ref up to date
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback((useBackgroundTimeout = false) => {
    // Clear existing timer
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Set new timer with appropriate timeout
    const currentTimeout = useBackgroundTimeout ? backgroundTimeout : timeout;
    timeoutIdRef.current = setTimeout(() => {
      onIdleRef.current();
    }, currentTimeout);
  }, [timeout, backgroundTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      return;
    }

    // Start initial timer
    resetTimer();

    // Activity event handler
    const handleActivity = () => {
      resetTimer(isBackgroundedRef.current);
    };

    // Add event listeners for user activity
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility change handler for tab switching and PWA backgrounding
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isBackgroundedRef.current = true;
        resetTimer(true); // Use background timeout
      } else if (document.visibilityState === 'visible') {
        // App came to foreground - restore normal timeout
        isBackgroundedRef.current = false;
        resetTimer(false); // Use normal timeout
      }
    };

    // Blur event handler (fallback for focus loss)
    const handleBlur = () => {
      isBackgroundedRef.current = true;
      resetTimer(true);
    };

    // Focus event handler
    const handleFocus = () => {
      isBackgroundedRef.current = false;
      resetTimer(false);
    };

    // Page hide handler (iOS PWA backup)
    const handlePageHide = () => {
      isBackgroundedRef.current = true;
      resetTimer(true);
    };

    // Add visibility and focus listeners for comprehensive coverage
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [enabled, events, resetTimer]);

  return {
    /**
     * Manually reset the idle timer
     */
    reset: resetTimer,
  };
}

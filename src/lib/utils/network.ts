/**
 * Network Utility
 * Provides network status detection and offline handling
 */

import { useState, useEffect } from 'react';

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  return typeof window !== 'undefined' ? navigator.onLine : true;
};

/**
 * Hook to monitor network status
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

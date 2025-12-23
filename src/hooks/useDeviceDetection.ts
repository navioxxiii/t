/**
 * Device Detection Hook
 * Detects user's device type and PWA installation status
 */

'use client';

import { useMemo } from 'react';

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  isMobile: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  // Use useMemo to compute device info only on client
  const deviceInfo = useMemo<DeviceInfo>(() => {
    // Return defaults for SSR
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isAndroid: false,
        isDesktop: false,
        isStandalone: false,
        isMobile: false,
      };
    }

    // Detect on client side
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
    const isAndroidDevice = /Android/i.test(userAgent);
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      'standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isMobileDevice = isIOSDevice || isAndroidDevice;
    const isDesktopDevice = !isMobileDevice;

    return {
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isDesktop: isDesktopDevice,
      isStandalone: isStandaloneMode,
      isMobile: isMobileDevice,
    };
  }, []); // Empty deps - only compute once

  return deviceInfo;
}

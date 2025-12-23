/**
 * Offline Indicator Component
 * Shows a banner when the user is offline
 */

'use client';

import { useNetworkStatus } from '@/lib/utils/network';

export function OfflineIndicator() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-center py-2 text-sm font-medium">
      No internet connection
    </div>
  );
}

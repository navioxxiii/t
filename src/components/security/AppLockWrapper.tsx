/**
 * App Lock Wrapper
 * Handles idle timeout detection and renders lock screen when inactive
 */

'use client';

import { useAuthStore } from '@/stores/authStore';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { AppLockScreen } from './AppLockScreen';

interface AppLockWrapperProps {
  children: React.ReactNode;
}

export function AppLockWrapper({ children }: AppLockWrapperProps) {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const hasPinSetup = useAuthStore((state) => state.hasPinSetup);
  const isLocked = useAuthStore((state) => state.isLocked);
  const lockApp = useAuthStore((state) => state.lockApp);
  const unlockApp = useAuthStore((state) => state.unlockApp);

  // Get idle timeout from user preferences (default 5 minutes)
  const idleTimeoutMinutes = profile?.security_preferences?.idle_timeout_minutes ?? 5;
  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;

  // Background timeout when app is hidden - proportional to idle timeout
  // 1/5 of idle timeout, minimum 30 seconds, maximum 2 minutes
  const backgroundTimeoutMs = idleTimeoutMinutes === 0
    ? 0 // If "Never", don't lock on background either
    : Math.max(30 * 1000, Math.min(idleTimeoutMs / 5, 2 * 60 * 1000));

  // Only enable idle timeout if user is authenticated, has PIN setup, and timeout is not disabled
  const shouldEnableIdleTimeout = !!user && hasPinSetup && idleTimeoutMinutes > 0;

  // Setup idle timeout hook with accelerated background timeout
  useIdleTimeout({
    timeout: idleTimeoutMs,
    backgroundTimeout: backgroundTimeoutMs,
    onIdle: lockApp,
    enabled: shouldEnableIdleTimeout && !isLocked,
  });

  // Get user display name
  const userDisplayName = profile?.full_name || profile?.email || undefined;

  // Check if device auth is enabled
  const hasDeviceAuth = profile?.security_preferences?.device_auth_enabled ?? false;

  /**
   * Simple approach: Hide content with opacity, conditionally render lock screen
   * No display:none - keeps layout intact
   * No complex transitions - just works
   */
  console.log('AppLockWrapper rendering, isLocked:', isLocked);
  return (
    <div className="relative">
      {/* Main app content - hidden with opacity when locked */}
      <div
        className={isLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        aria-hidden={isLocked}
      >
        {children}
      </div>

      {/* Lock screen - only render when actually locked */}
      {isLocked && (
        <AppLockScreen
          onUnlock={unlockApp}
          userDisplayName={userDisplayName}
          hasDeviceAuth={hasDeviceAuth}
        />
      )}
    </div>
  );
}

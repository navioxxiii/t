/**
 * App Lock Screen
 * Full-screen PIN entry when app is locked due to idle timeout
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PinInput } from './PinInput';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, AlertCircle, Lock, ShieldAlert, Fingerprint, LogOut } from 'lucide-react';

interface AppLockScreenProps {
  /**
   * Callback when PIN is successfully verified
   */
  onUnlock: () => void;

  /**
   * User's full name or email for display
   */
  userDisplayName?: string;

  /**
   * Whether device authentication is enabled
   */
  hasDeviceAuth?: boolean;
}

export function AppLockScreen({
  onUnlock,
  userDisplayName,
  hasDeviceAuth = false,
}: AppLockScreenProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { authenticate, isAuthenticating, error: webAuthnError } = useWebAuthn();
  const signOut = useAuthStore((state) => state.signOut);

  // Countdown timer for locked state
  useEffect(() => {
    if (isLockedOut && lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (lockTimeRemaining === 0 && isLockedOut) {
      setIsLockedOut(false);
      setError('');
      setAttemptsRemaining(null);
    }
  }, [isLockedOut, lockTimeRemaining]);

  // Reset state on unmount (when lock screen closes)
  useEffect(() => {
    return () => {
      setError('');
      setIsLoading(false);
      setAttemptsRemaining(null);
      setIsLockedOut(false);
      setLockTimeRemaining(0);
      setFailedAttempts(0);
    };
  }, []);

  const handlePinComplete = async (pin: string) => {
    if (isLockedOut) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/pin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // PIN verified successfully - unlock app
        onUnlock();
      } else if (data.locked) {
        // Account locked
        setIsLockedOut(true);
        setLockTimeRemaining(data.remainingSeconds || 30);
        setError(data.error || 'Too many failed attempts');
      } else {
        // Incorrect PIN
        setError(data.error || 'Incorrect PIN');
        setAttemptsRemaining(data.attemptsRemaining ?? null);
        setFailedAttempts((prev) => prev + 1);
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceAuth = async () => {
    setError('');
    const success = await authenticate();

    if (success) {
      onUnlock();
    } else if (webAuthnError) {
      setError(webAuthnError.message);
    }
  };

  /**
   * Simple fixed positioning approach
   * Scrollable to handle keyboard appearance
   * Only renders when actually locked
   */
  return (
    <div className="fixed inset-0 z-[999] bg-bg-primary isolate">
      {/* Scrollable container for keyboard support */}
      <div className="h-full overflow-y-auto pointer-events-auto">
        {/* Center content vertically */}
        <div className="min-h-full flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
        {/* Lock Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            {isLockedOut ? (
              <ShieldAlert className="w-10 h-10 text-red-600" />
            ) : (
              <Lock className="w-10 h-10 text-primary" />
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isLockedOut ? 'Account Locked' : 'App Locked'}
          </h1>
          <p className="text-text-secondary">
            {isLockedOut
              ? `Too many failed attempts. Try again in ${lockTimeRemaining}s`
              : userDisplayName
              ? `Welcome back, ${userDisplayName}`
              : 'Enter your PIN to unlock'}
          </p>
        </div>

        {/* PIN Input */}
        {!isLockedOut && (
          <div className="mb-6">
            <PinInput
              onComplete={handlePinComplete}
              onClear={() => {
                setError('');
                setAttemptsRemaining(null);
              }}
              error={!!error}
              disabled={isLoading || isLockedOut}
              autoFocus={true}
            />
          </div>
        )}

        {/* Error Message */}
        {error && !isLockedOut && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <span className="block mt-1">
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'}{' '}
                  remaining
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Locked Message */}
        {isLockedOut && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Your account has been temporarily locked due to multiple failed PIN attempts.
              Please wait {lockTimeRemaining} seconds before trying again.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying PIN...
          </div>
        )}

        {/* Device Auth Button */}
        {hasDeviceAuth && !isLockedOut && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-bg-tertiary" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-primary px-2 text-text-tertiary">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDeviceAuth}
              disabled={isAuthenticating || isLoading}
              className="w-full mt-6 gap-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Use Biometrics
                </>
              )}
            </Button>
          </div>
        )}

        {/* Forgot PIN Option */}
        {(isLockedOut || failedAttempts >= 3) && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-bg-tertiary" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-primary px-2 text-text-tertiary">
                  {isLockedOut ? 'Need Help?' : 'Forgot PIN?'}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={signOut}
              disabled={isLoading || isAuthenticating}
              className="w-full mt-6 gap-2 text-text-secondary hover:text-text-primary"
            >
              <LogOut className="w-4 h-4" />
              Sign out and log in again
            </Button>

            <p className="text-xs text-text-tertiary text-center mt-3">
              You&apos;ll need to sign in with your email and password, then you can set a new PIN in Settings
            </p>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-sm text-text-tertiary mt-8">
          <p>Your app was locked due to inactivity</p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

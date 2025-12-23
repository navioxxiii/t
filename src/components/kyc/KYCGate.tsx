/**
 * KYC Gate Component
 * Blocks access to dashboard features until KYC is approved
 * Shows appropriate screens based on KYC status
 */

'use client';

import { useAuthStore } from '@/stores/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const MAX_RETRIES = 3;
const RECONNECT_TIMEOUT_MS = 15000; // 15 seconds

export function KYCGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const profileError = useAuthStore((state) => state.profileError);
  const fetchAttempts = useAuthStore((state) => state.fetchAttempts);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const forceLogout = useAuthStore((state) => state.forceLogout);
  const router = useRouter();
  const path = usePathname();

  const [showReconnecting, setShowReconnecting] = useState(false);
  const [reconnectTimeout, setReconnectTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Timeout for reconnecting state
  useEffect(() => {
    if (!showReconnecting) return;

    const timer = setTimeout(() => {
      setReconnectTimeout(true);
      setShowReconnecting(false);
    }, RECONNECT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [showReconnecting]);

  // Reset states when profile loads successfully
  useEffect(() => {
    if (profile) {
      setShowReconnecting(false);
      setReconnectTimeout(false);
      setRetryCount(0);
      setIsRetrying(false);
    }
  }, [profile]);

  // Return null during logout to prevent error flash
  if (isLoggingOut) {
    return null;
  }

  // If no user after loading completes, redirect to login
  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center bg-bg-primary pt-safe pb-safe">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-text-secondary">
            {showReconnecting ? 'Reconnecting...' : 'Loading your account...'}
          </p>
          {fetchAttempts > 1 && (
            <p className="text-xs text-text-tertiary">
              Attempt {fetchAttempts} of {MAX_RETRIES + 1}
            </p>
          )}
        </div>
      </div>
    );
  }

  // No profile loaded after loading finished - show error with recovery options
  if (!profile && !loading) {
    // Last-ditch localStorage recovery before showing error
    if (typeof window !== 'undefined' && !showReconnecting && retryCount < MAX_RETRIES && !reconnectTimeout) {
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed?.state?.profile) {
            setShowReconnecting(true);
            setRetryCount(prev => prev + 1);
            refreshProfile();
            return (
              <div className="flex h-full items-center justify-center bg-bg-primary pt-nav pb-safe">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                  <p className="text-text-secondary">Reconnecting...</p>
                  <p className="text-xs text-text-tertiary">
                    Attempt {retryCount + 1} of {MAX_RETRIES}
                  </p>
                </div>
              </div>
            );
          }
        } catch {
          // Fall through to error screen
        }
      }
    }

    // Show reconnecting spinner if still in progress
    if (showReconnecting && !reconnectTimeout) {
      return (
        <div className="flex h-full items-center justify-center bg-bg-primary pt-nav pb-safe">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-text-secondary">Reconnecting...</p>
          </div>
        </div>
      );
    }

    // Final error screen with improved options
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary px-4 pt-safe pb-safe pl-safe pr-safe">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-primary/10 p-6">
              <ShieldCheck className="h-12 w-12 text-brand-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              {reconnectTimeout ? 'Connection Timeout' : 'Connection Issue'}
            </h1>
            <p className="text-text-secondary">
              {reconnectTimeout
                ? 'The connection is taking longer than expected. Please check your internet connection.'
                : "We're having trouble connecting to your account."}
            </p>
            {profileError && (
              <p className="text-xs text-text-tertiary mt-2">
                Error: {profileError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={async () => {
                setRetryCount(0);
                setReconnectTimeout(false);
                setShowReconnecting(true);
                setIsRetrying(true);
                await refreshProfile();
                setIsRetrying(false);
              }}
              className="w-full"
              size="lg"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Trying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>

            {/* Allow logout even when profile isn't loaded */}
            <Button
              variant="outline"
              onClick={forceLogout}
              className="w-full"
              size="lg"
            >
              Sign Out
            </Button>

            <p className="text-xs text-text-tertiary">
              Still having issues?{' '}
              <Link href="/support/new" className="text-brand-primary underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // At this point, profile must exist
  if (!profile) {
    router.push('/login');
    return null;
  }

  const isKycPage = path?.startsWith('/kyc') || path?.startsWith('/settings/kyc');

  // Admin/Super Admin bypass KYC
  if (profile.role === 'admin' || profile.role === 'super_admin' || isKycPage) {
    return <>{children}</>;
  }

  // Check KYC status
  const kycStatus = profile.kyc_status || 'not_started';

  // KYC Not Started - Immediate Gate
  if (kycStatus === 'not_started') {
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary pt-24 pb-safe pl-safe pr-safe">
        <div className="w-full max-w-md space-y-6 text-center px-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-primary/10 p-6">
              <ShieldCheck className="h-12 w-12 text-brand-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Identity Verification Required
            </h1>
          </div>

          <div className="space-y-3 rounded-lg bg-bg-secondary border border-bg-tertiary p-4">
            <h3 className="text-sm font-semibold text-text-primary">Why verify?</h3>
            <ul className="space-y-2 text-left text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>Secure your account and prevent fraud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>Unlock higher transaction limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>Access all platform features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>Comply with legal requirements</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={() => {
              setIsNavigating(true);
              router.push('/kyc');
            }}
            className="w-full"
            size="lg"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-5 w-5" />
            )}
            Start Verification
          </Button>

          <p className="text-xs text-text-tertiary">
            Verification usually takes 1-3 business days
          </p>
        </div>
      </div>
    );
  }

  // KYC Pending/Under Review
  if (kycStatus === 'pending' || kycStatus === 'under_review') {
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary px-4 pt-24 pb-safe pl-safe pr-safe">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-primary/10 p-6">
              <Clock className="h-12 w-12 text-brand-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Verification In Progress
            </h1>
            <p className="text-text-secondary">
              Your identity verification is currently being reviewed by our team. This usually takes
              1-3 business days.
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-bg-secondary border border-bg-tertiary p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Status</span>
              <span className="font-medium text-brand-primary capitalize">
                {kycStatus === 'under_review' ? 'Under Review' : 'Pending'}
              </span>
            </div>
            {profile.kyc_tier && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Tier</span>
                <span className="font-medium text-text-primary">
                  {profile.kyc_tier === 'tier_1_basic' ? 'Basic Verification' : 'Elite Membership'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-text-tertiary">
              You&apos;ll receive an email notification once your verification is complete.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsNavigating(true);
                router.push('/settings/kyc');
              }}
              className="w-full"
              disabled={isNavigating}
            >
              {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // KYC Rejected
  if (kycStatus === 'rejected') {
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary pt-24 pb-safe pl-safe pr-safe">
        <div className="w-full max-w-md space-y-6 text-center px-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-action-red/10 p-6">
              <XCircle className="h-12 w-12 text-action-red" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Verification Unsuccessful
            </h1>
            <p className="text-text-secondary">
              Unfortunately, we were unable to verify your identity with the information provided.
            </p>
          </div>

          {profile.kyc_rejection_reason && (
            <div className="space-y-2 rounded-lg bg-action-red/10 border border-action-red/30 p-4">
              <h3 className="text-sm font-semibold text-action-red">Reason</h3>
              <p className="text-sm text-text-secondary">{profile.kyc_rejection_reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => {
                setIsNavigating(true);
                router.push('/kyc');
              }}
              className="w-full"
              size="lg"
              disabled={isNavigating}
            >
              {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resubmit Verification
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setIsNavigating(true);
                router.push('/settings/kyc');
              }}
              className="w-full"
              disabled={isNavigating}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // KYC Approved - Allow access
  return <>{children}</>;
}

/**
 * KYC Status Banner
 * Shows KYC status banner in dashboard (similar to EmailVerificationBanner)
 * Only shows for approved users who might want to upgrade tier
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, X, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function KYCStatusBanner() {
  return null; // Temporarily disable the KYC upgrade banner
  const profile = useAuthStore((state) => state.profile);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or not logged in
  if (!profile || isDismissed) {
    return null;
  }

  // Only show for Tier 1 users who can upgrade
  if (profile?.kyc_tier !== 'tier_1_basic') {
    return null;
  }

  return (
    <Alert className="relative bg-brand-primary/10 border-brand-primary/30 mb-4">
      <div className="flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-brand-primary mt-0.5" />

        <div className="flex-1">
          <AlertDescription className="text-text-primary">
            <strong>Elite Membership Available</strong>
            <p className="text-sm text-text-secondary mt-1">
              You&apos;re verified with <span className="font-medium text-brand-primary">Basic Verification</span>.
              Interested in unlimited limits and exclusive features? Elite membership is available by invitation.
            </p>
          </AlertDescription>

          <div className="flex gap-2 mt-3">
            <Link href="/settings/kyc">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-brand-primary text-brand-primary hover:bg-brand-primary/10"
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                Learn About Elite
              </Button>
            </Link>

            <Link href="/settings/kyc">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-text-tertiary hover:text-text-primary"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

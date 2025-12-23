/**
 * Email Verification Banner
 * Shows in dashboard if user's email is not verified
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function EmailVerificationBanner() {
  const user = useAuthStore((state) => state.user);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Don't show if verified or dismissed
  if (!user || user.email_confirmed_at || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent! Check your inbox');
      } else {
        toast.error(data.error || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="relative bg-brand-primary/10 border-brand-primary/30 mb-6">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-brand-primary mt-0.5" />

        <div className="flex-1">
          <AlertDescription className="text-text-primary">
            <strong>Verify your email to unlock all features</strong>
            <p className="text-sm text-text-secondary mt-1">
              We sent a verification code to <span className="font-medium">{user.email}</span>
            </p>
          </AlertDescription>

          <div className="flex gap-2 mt-3">
            <Link href="/verify-email">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-brand-primary text-brand-primary hover:bg-brand-primary/10"
              >
                Enter Verification Code
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-text-secondary hover:text-text-primary"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Code'
              )}
            </Button>
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

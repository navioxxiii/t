/**
 * Email Verification Page - Binance Style
 * Shows after signup, prompts user to enter 6-digit verification code
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CodeInput } from '@/components/auth/CodeInput';
import { branding } from '@/config/branding';
import Image from 'next/image';

function VerifyEmailContent() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for email URL parameter immediately (before any useEffect runs)
  const emailParam = searchParams.get('email');
  const initialEmail = emailParam ? decodeURIComponent(emailParam) : '';
  const isUnauthFlow = !!emailParam;

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isMaxAttemptsReached, setIsMaxAttemptsReached] = useState(false);
  const [lastAttemptedCode, setLastAttemptedCode] = useState<string>('');
  const hasVerifiedRef = useRef(false);
  const MAX_VERIFICATION_ATTEMPTS = 5;

  // Unauthenticated flow state
  const [unauthEmail, setUnauthEmail] = useState(initialEmail);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(initialEmail || null);
  const [isUnauthenticated] = useState(isUnauthFlow);

  // Redirect if not logged in and no email param
  useEffect(() => {
    if (!user && !isUnauthenticated) {
      router.push('/login');
    }
  }, [user, isUnauthenticated, router]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleCodeComplete = async (code: string) => {
    // Prevent duplicate submissions or max attempts reached
    if (isVerifying || hasVerifiedRef.current || isMaxAttemptsReached) {
      return;
    }

    // Prevent submitting the same failed code again
    if (code === lastAttemptedCode && verificationAttempts > 0) {
      setError('Please request a new code or try a different code');
      toast.error('This code was already tried. Request a new code.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setLastAttemptedCode(code);

    try {
      const payload = isUnauthenticated
        ? { code, email: confirmedEmail }
        : { code };

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        hasVerifiedRef.current = true; // Mark as verified
        toast.success('Email verified successfully!');

        // Small delay before redirect to prevent race conditions
        setTimeout(() => {
          if (isUnauthenticated) {
            router.push('/login?verified=true');
          } else {
            router.push('/dashboard');
          }
        }, 500);
      } else {
        // Increment attempt counter
        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);

        // Check if max attempts reached
        if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          setIsMaxAttemptsReached(true);
          setError('Maximum verification attempts reached. Please request a new code.');
          toast.error('Too many attempts. Request a new code to continue.');
        } else {
          const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - newAttempts;
          const errorMsg = data.error || 'Invalid verification code';
          setError(`${errorMsg} (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`);
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify code. Please try again.');
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      const payload = isUnauthenticated
        ? { email: confirmedEmail }
        : {};

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('New verification code sent! Check your email');
        setCanResend(false);
        setCountdown(60); // 60 second cooldown
        // Reset attempt tracking for new code
        setVerificationAttempts(0);
        setIsMaxAttemptsReached(false);
        setLastAttemptedCode('');
      } else {
        toast.error(data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend code. Please try again');
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailConfirm = async () => {
    setShowEmailConfirm(false);
    setConfirmedEmail(unauthEmail);

    // Automatically send the first verification code
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unauthEmail }),
      });

      if (response.ok) {
        toast.success('Verification code sent! Check your email');
        setCanResend(false);
        setCountdown(60);
      }
    } catch (error) {
      console.error('Error sending initial code:', error);
      toast.error('Failed to send verification code');
    }
  };

  if (!user && !isUnauthenticated) {
    return null; // Will redirect
  }

  // Email confirmation dialog
  if (showEmailConfirm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <Card className="w-full max-w-md bg-bg-secondary border-bg-tertiary">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center">
              <Mail className="h-12 w-12 text-brand-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-text-primary">
                Confirm Your Email
              </CardTitle>
              <CardDescription className="text-text-secondary mt-2">
                We&apos;ll send a verification code to this email address
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={unauthEmail}
                onChange={(e) => setUnauthEmail(e.target.value)}
                className="bg-bg-tertiary border-bg-tertiary text-text-primary"
              />
            </div>
            <Button onClick={handleEmailConfirm} className="w-full">
              Send Verification Code
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-brand-primary transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayEmail = isUnauthenticated ? confirmedEmail : user?.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <Card className="w-full max-w-md bg-bg-secondary border-bg-tertiary">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center">
            <Image
              src={branding.logo.src}
              alt={branding.logo.alt}
              width={64}
              height={64}
              priority
            />
          </div>

          {/* Title */}
          <div>
            <CardTitle className="text-2xl font-bold text-text-primary">
              Email Verification
            </CardTitle>
            <CardDescription className="text-text-secondary mt-2">
              Enter the 6-digit code we sent to
            </CardDescription>
            <p className="font-medium text-text-primary mt-1">
              {displayEmail}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Code Input */}
          <CodeInput
            onComplete={handleCodeComplete}
            onResend={handleResendCode}
            isLoading={isVerifying}
            isResending={isResending}
            canResend={canResend}
            countdown={countdown}
            error={error}
            disabled={isMaxAttemptsReached}
          />

          {/* Max Attempts Warning */}
          {isMaxAttemptsReached && (
            <Alert className="bg-action-red/10 border-action-red/30">
              <AlertCircle className="h-4 w-4 text-action-red" />
              <AlertDescription className="text-text-secondary text-sm">
                <strong className="text-action-red">Maximum Attempts Reached</strong>
                <br />
                Please request a new verification code to continue.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Info */}
          <Alert className="bg-bg-tertiary border-bg-tertiary">
            <ShieldCheck className="h-4 w-4 text-action-green" />
            <AlertDescription className="text-text-secondary text-sm">
              <strong className="text-text-primary">Security Notice</strong>
              <br />
              The code expires in 10 minutes. Maximum 5 attempts allowed.
            </AlertDescription>
          </Alert>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-bg-tertiary" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-secondary px-2 text-text-tertiary">
                Need help?
              </span>
            </div>
          </div>

          {/* Return to Login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-brand-primary transition-colors"
            >
              Return to Login
            </Link>
          </div>

          {/* Auto-redirect note */}
          <Alert className="bg-bg-primary border-bg-tertiary">
            <CheckCircle className="h-4 w-4 text-action-green" />
            <AlertDescription className="text-text-tertiary text-xs">
              This page will automatically redirect once your email is verified
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

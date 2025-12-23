/**
 * Device Authentication Setup Component
 * Enrollment for biometric/device authentication (Face ID, Touch ID, Windows Hello)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWebAuthn, isPlatformAuthenticatorAvailable } from '@/hooks/useWebAuthn';
import { Loader2, AlertCircle, Fingerprint, Check, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceAuthSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeviceAuthSetup({ open, onOpenChange, onSuccess }: DeviceAuthSetupProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [step, setStep] = useState<'intro' | 'registering' | 'success'>('intro');
  const { register, isRegistering, error } = useWebAuthn();

  // Check if platform authenticator is available
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isPlatformAuthenticatorAvailable();
      setIsSupported(supported);
    };

    if (open) {
      checkSupport();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    // Only reset when closing (not opening) to avoid setState in effect on mount
    return () => {
      if (!open) {
        setStep('intro');
      }
    };
  }, [open]);

  const handleRegister = async () => {
    setStep('registering');

    const success = await register();

    if (success) {
      setStep('success');
      toast.success('Device authentication enabled!');

      // Wait before closing
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } else {
      setStep('intro');
    }
  };

  const getDeviceTypeMessage = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'Use Face ID or Touch ID to unlock your wallet';
    } else if (userAgent.includes('android')) {
      return 'Use your fingerprint or face unlock to access your wallet';
    } else if (userAgent.includes('mac')) {
      return 'Use Touch ID to unlock your wallet';
    } else if (userAgent.includes('windows')) {
      return 'Use Windows Hello (fingerprint, face, or PIN) to unlock your wallet';
    }

    return 'Use your device biometrics to unlock your wallet';
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'success' ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <Fingerprint className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <ResponsiveDialogTitle className="text-center">
            {step === 'intro' && 'Set Up Device Authentication'}
            {step === 'registering' && 'Authenticating...'}
            {step === 'success' && 'All Set!'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center">
            {step === 'intro' && getDeviceTypeMessage()}
            {step === 'registering' && 'Follow the prompt on your device'}
            {step === 'success' && 'Device authentication is now enabled'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Intro Step */}
          {step === 'intro' && (
            <>
              {/* Not Supported Warning */}
              {isSupported === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your device doesn&apos;t support biometric authentication. You can still use
                    your 4-digit PIN to unlock the app.
                  </AlertDescription>
                </Alert>
              )}

              {/* Support Check Loading */}
              {isSupported === null && (
                <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking device capabilities...
                </div>
              )}

              {/* Features List */}
              {isSupported && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Quick & Secure</div>
                      <div className="text-sm text-text-secondary">
                        Unlock your wallet instantly with biometrics
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Device-Level Security</div>
                      <div className="text-sm text-text-secondary">
                        Uses your device&apos;s built-in authentication
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900">
                      <strong>Note:</strong> Your PIN will still be required for sending
                      transactions. Device authentication only unlocks the app.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error.message}</AlertDescription>
                </Alert>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={isRegistering}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegister}
                  className="flex-1"
                  disabled={!isSupported || isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    'Enable'
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Registering Step */}
          {step === 'registering' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-text-secondary text-center">
                Please authenticate on your device to continue...
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-text-secondary text-center">
                You can now unlock your wallet using your device biometrics!
              </p>
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

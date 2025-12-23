/**
 * Change PIN Dialog Component
 * Allows users to change their 4-digit PIN code
 */

'use client';

import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PinInput } from '@/components/security/PinInput';
import { AlertCircle, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { haptics } from '@/lib/utils/haptics';

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'current' | 'new' | 'confirm' | 'success';

export function ChangePinDialog({ open, onOpenChange, onSuccess }: ChangePinDialogProps) {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Reset all state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('current');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setAttemptsRemaining(null);
      setLockoutSeconds(null);
    }
    onOpenChange(newOpen);
  };

  // Handle current PIN submission
  const handleCurrentPinComplete = async (pin: string) => {
    setCurrentPin(pin);
    setError(null);
    setStep('new');
  };

  // Handle new PIN submission
  const handleNewPinComplete = (pin: string) => {
    setNewPin(pin);
    setError(null);
    setStep('confirm');
  };

  // Handle confirm PIN submission
  const handleConfirmPinComplete = async (pin: string) => {
    setConfirmPin(pin);

    // Check if PINs match
    if (pin !== newPin) {
      setError('PINs do not match. Please try again.');
      // Reset to new PIN step
      setTimeout(() => {
        setNewPin('');
        setConfirmPin('');
        setError(null);
        setStep('new');
      }, 1500);
      return;
    }

    // Submit PIN change
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security/pin/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.locked) {
          setLockoutSeconds(data.remainingSeconds);
          setError(`Too many failed attempts. Try again in ${data.remainingSeconds}s`);
          // Reset to current PIN step
          setTimeout(() => {
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setStep('current');
          }, 2000);
        } else if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
          setError(data.error || 'Current PIN is incorrect');
          // Reset to current PIN step
          setTimeout(() => {
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setStep('current');
          }, 1500);
        } else {
          setError(data.error || 'Failed to change PIN');
        }
        return;
      }

      // Success!
      haptics.success();
      setStep('success');
      toast.success('PIN changed successfully');

      // Wait before closing
      setTimeout(() => {
        onSuccess();
        handleOpenChange(false);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change PIN';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'current':
        return 'Enter Current PIN';
      case 'new':
        return 'Enter New PIN';
      case 'confirm':
        return 'Confirm New PIN';
      case 'success':
        return 'PIN Changed!';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'current':
        return 'Enter your current 4-digit PIN to continue';
      case 'new':
        return 'Choose a new 4-digit PIN';
      case 'confirm':
        return 'Re-enter your new PIN to confirm';
      case 'success':
        return 'Your PIN has been changed successfully';
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'success' ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <Lock className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <ResponsiveDialogTitle className="text-center">{getStepTitle()}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center">
            {getStepDescription()}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Current PIN Step */}
          {step === 'current' && (
            <div className="space-y-4">
              <PinInput
                onComplete={handleCurrentPinComplete}
                error={!!error}
                disabled={isLoading}
                autoFocus
              />

              {/* Attempts remaining warning */}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'}{' '}
                    remaining
                  </AlertDescription>
                </Alert>
              )}

              {/* Lockout warning */}
              {lockoutSeconds !== null && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Too many failed attempts. Try again in {lockoutSeconds}s
                  </AlertDescription>
                </Alert>
              )}

              {/* Error message */}
              {error && !attemptsRemaining && !lockoutSeconds && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* New PIN Step */}
          {step === 'new' && (
            <div className="space-y-4">
              <PinInput onComplete={handleNewPinComplete} disabled={isLoading} autoFocus />

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  Choose a PIN that&apos;s easy to remember but hard to guess
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Confirm PIN Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <PinInput
                onComplete={handleConfirmPinComplete}
                error={!!error}
                disabled={isLoading}
                autoFocus
              />

              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-text-secondary text-center">
                Your PIN has been changed successfully
              </p>
            </div>
          )}

          {/* Cancel Button */}
          {step !== 'success' && !isLoading && (
            <div className="flex justify-center pt-4">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

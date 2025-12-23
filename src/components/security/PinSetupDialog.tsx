/**
 * PIN Setup Dialog
 * Mandatory first-time PIN creation for transaction security
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
import { PinInput } from './PinInput';
import { Loader2, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PinSetupDialogProps {
  open: boolean;
  onSuccess: () => void;
}

type Step = 'create' | 'confirm' | 'success';

export function PinSetupDialog({ open, onSuccess }: PinSetupDialogProps) {
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setError('');
    setStep('confirm');
  };

  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== firstPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/pin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: confirmPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup PIN');
      }

      setStep('success');
      toast.success('PIN created successfully!');

      // Wait 1 second before closing
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to setup PIN';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCreate = () => {
    setStep('create');
    setFirstPin('');
    setError('');
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={() => {}}>
      <ResponsiveDialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Lock className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <ResponsiveDialogTitle className="text-center">
            {step === 'create' && 'Create Your Transaction PIN'}
            {step === 'confirm' && 'Confirm Your PIN'}
            {step === 'success' && 'PIN Created!'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center">
            {step === 'create' &&
              'Enter a 4-digit PIN to secure your transactions'}
            {step === 'confirm' && 'Enter your PIN again to confirm'}
            {step === 'success' &&
              'Your PIN has been set up successfully'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 py-6 space-y-6">
          {step === 'create' && (
            <>
              <PinInput
                onComplete={handleFirstPinComplete}
                onClear={() => setError('')}
                error={!!error}
                disabled={isLoading}
                autoFocus={true}
              />

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Important:</strong> You&apos;ll need this PIN to confirm all send
                  transactions. Keep it safe!
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === 'confirm' && (
            <>
              <PinInput
                onComplete={handleConfirmPinComplete}
                onClear={() => setError('')}
                error={!!error}
                disabled={isLoading}
                autoFocus={true}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up PIN...
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleBackToCreate}
                disabled={isLoading}
                className="w-full"
              >
                Back
              </Button>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                You can now make secure transactions!
              </p>
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

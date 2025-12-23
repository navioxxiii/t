/**
 * Transaction PIN Dialog
 * PIN verification before confirming send transactions
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
import { PinInput } from './PinInput';
import { Loader2, AlertCircle, Lock, ShieldAlert } from 'lucide-react';

interface TransactionPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  transactionDetails?: {
    amount: string;
    coinSymbol: string;
    toAddress: string;
  };
}

export function TransactionPinDialog({
  open,
  onOpenChange,
  onVerified,
  transactionDetails,
}: TransactionPinDialogProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Countdown timer for locked state
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (lockTimeRemaining === 0 && isLocked) {
      setIsLocked(false);
      setError('');
      setAttemptsRemaining(null);
    }
  }, [isLocked, lockTimeRemaining]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setError('');
      setIsLoading(false);
      setAttemptsRemaining(null);
      setIsLocked(false);
      setLockTimeRemaining(0);
    }
  }, [open]);

  const handlePinComplete = async (pin: string) => {
    if (isLocked) return;

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
        // PIN verified successfully
        onVerified();
        onOpenChange(false);
      } else if (data.locked) {
        // Account locked
        setIsLocked(true);
        setLockTimeRemaining(data.remainingSeconds || 30);
        setError(data.error || 'Too many failed attempts');
      } else {
        // Incorrect PIN
        setError(data.error || 'Incorrect PIN');
        setAttemptsRemaining(data.attemptsRemaining ?? null);
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isLocked ? (
                <ShieldAlert className="w-8 h-8 text-red-600" />
              ) : (
                <Lock className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <ResponsiveDialogTitle className="text-center">
            {isLocked ? 'Account Temporarily Locked' : 'Enter Your PIN'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center">
            {isLocked
              ? `Too many failed attempts. Try again in ${lockTimeRemaining}s`
              : 'Confirm this transaction with your 4-digit PIN'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Transaction Details */}
          {transactionDetails && !isLocked && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {transactionDetails.amount} {transactionDetails.coinSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-mono text-xs truncate ml-2 max-w-[200px]">
                  {transactionDetails.toAddress}
                </span>
              </div>
            </div>
          )}

          {/* PIN Input */}
          {!isLocked && (
            <PinInput
              onComplete={handlePinComplete}
              onClear={() => {
                setError('');
                setAttemptsRemaining(null);
              }}
              error={!!error}
              disabled={isLoading || isLocked}
              autoFocus={true}
            />
          )}

          {/* Error Message */}
          {error && !isLocked && (
            <Alert variant="destructive">
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
          {isLocked && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Your account has been temporarily locked due to multiple failed PIN attempts.
                Please wait {lockTimeRemaining} seconds before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying PIN...
            </div>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

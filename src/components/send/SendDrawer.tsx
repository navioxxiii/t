/**
 * Send Drawer Component
 * Mobile-first bottom sheet for sending crypto (Phantom-style)
 */

'use client';

import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { SendForm } from './SendForm';
import { SendConfirmation } from './SendConfirmation';
import { ArrowUpRight } from 'lucide-react';
import type { UserBalance } from '@/types/balance';

export interface SendDrawerProps {
  balance: UserBalance;
  trigger?: React.ReactNode;
  // Controlled mode props (optional)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'form' | 'confirm' | 'success';

interface SendData {
  toAddress: string;
  amount: string;
  estimatedFee: string;
  deploymentSymbol: string;
  networkCode: string;
}

export function SendDrawer({
  balance,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SendDrawerProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [sendData, setSendData] = useState<SendData | null>(null);

  // Extract token info from balance
  const coinSymbol = balance.token.symbol;
  const coinName = balance.token.name;

  // Use controlled props if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const handleFormSubmit = (data: SendData) => {
    setSendData(data);
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('success');
    // Close drawer after short delay
    setTimeout(() => {
      setOpen(false);
      resetDrawer();
    }, 2000);
  };

  const handleCancel = () => {
    setStep('form');
    setSendData(null);
  };

  const resetDrawer = () => {
    setStep('form');
    setSendData(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset on close
      setTimeout(resetDrawer, 300); // Wait for animation
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <ResponsiveDialogTrigger asChild>
          {trigger}
        </ResponsiveDialogTrigger>
      )}
      {!trigger && !isControlled && (
        <ResponsiveDialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Send
          </Button>
        </ResponsiveDialogTrigger>
      )}
      <ResponsiveDialogContent className="max-h-[90vh]">
        <ResponsiveDialogHeader className="text-left">
          <ResponsiveDialogTitle>
            {step === 'form' && `Send ${coinName}`}
            {step === 'confirm' && 'Confirm Send'}
            {step === 'success' && 'Request Submitted'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === 'form' && `Send ${coinSymbol} to another address`}
            {step === 'confirm' && 'Review your transaction details'}
            {step === 'success' && 'Your send request has been submitted'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {step === 'form' && (
            <SendForm
              balance={balance}
              onSubmit={handleFormSubmit}
              onCancel={() => setOpen(false)}
            />
          )}

          {step === 'confirm' && sendData && (
            <SendConfirmation
              deploymentSymbol={sendData.deploymentSymbol}
              coinSymbol={coinSymbol}
              toAddress={sendData.toAddress}
              amount={sendData.amount}
              estimatedFee={sendData.estimatedFee}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Transaction Submitted</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Broadcasting to the network
              </p>
              <p className="text-xs text-muted-foreground">
                Track your transaction in the Activity section
              </p>
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

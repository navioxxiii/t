/**
 * Send Confirmation Component
 * Final review step before submitting send request
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateSendRequest } from '@/hooks/useSend';
import { useCoinPrice } from '@/hooks/useCoinPrices';
import { formatUSD } from '@/lib/utils/currency';
import { TransactionPinDialog } from '@/components/security/TransactionPinDialog';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';

export interface SendConfirmationProps {
  deploymentSymbol: string;
  coinSymbol: string;
  toAddress: string;
  amount: string;
  estimatedFee: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SendConfirmation({
  deploymentSymbol,
  coinSymbol,
  toAddress,
  amount,
  estimatedFee,
  onConfirm,
  onCancel,
}: SendConfirmationProps) {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const { mutate: createSendRequest, isPending, isError, error } = useCreateSendRequest();
  const { data: coinPrice } = useCoinPrice(coinSymbol);

  const amountNum = parseFloat(amount);
  const feeNum = parseFloat(estimatedFee);
  const priceNum = coinPrice?.current_price || 0;

  const totalUsdValue = (amountNum * priceNum) + feeNum;

  const handleConfirmClick = () => {
    // Haptic feedback on confirm button press
    haptics.medium();
    // Show PIN dialog before submitting
    setShowPinDialog(true);
  };

  const handlePinVerified = () => {
    // PIN verified, now submit the transaction
    createSendRequest(
      {
        deploymentSymbol,
        toAddress,
        amount,
        estimatedFee,
      },
      {
        onSuccess: () => {
          // Success haptic on successful transaction submission
          haptics.success();
          onConfirm();
        },
        onError: (error) => {
          // Error haptic on transaction failure
          haptics.error();
          console.error('Send request failed:', error);
        },
      }
    );
  };

  return (
    <div className="space-y-6 py-4">
      {/* Amount Display */}
      <div className="text-center py-6 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground mb-2">You&apos;re sending</div>
        <div className="text-3xl font-bold">
          {amount} {coinSymbol}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {coinPrice ? `~ ${formatUSD(amountNum * priceNum)}` : <Loader2 className="w-4 h-4 animate-spin inline-block" />}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        {/* Recipient */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">To</div>
          <div className="font-mono text-sm bg-muted/50 p-3 rounded-lg break-all">
            {toAddress}
          </div>
        </div>

        {/* Fee */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Network Fee</span>
          <span className="font-medium text-sm">
            {formatUSD(feeNum)}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center border-t pt-4">
          <span className="font-semibold">Total</span>
          <div className="text-right">
            <div className="font-bold text-lg">
              {amount} {coinSymbol}
            </div>
            <div className="text-sm text-muted-foreground">
              {coinPrice ? `~ ${formatUSD(totalUsdValue)}` : <Loader2 className="w-4 h-4 animate-spin inline-block" />}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to submit send request'}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isPending}
        >
          Back
        </Button>
        <Button onClick={handleConfirmClick} className="flex-1 gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Confirm Send
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* PIN Verification Dialog */}
      <TransactionPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onVerified={handlePinVerified}
        transactionDetails={{
          amount,
          coinSymbol,
          toAddress,
        }}
      />
    </div>
  );
}

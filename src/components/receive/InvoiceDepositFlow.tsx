/**
 * Invoice Deposit Flow Component
 * For memo-based currencies (XRP, XLM) that require fresh address+tag per deposit
 *
 * Flow:
 * 1. User optionally enters amount
 * 2. User clicks "Generate Deposit Address"
 * 3. System creates NOWPayments payment
 * 4. User sees address + destination tag + countdown timer
 * 5. System polls for status updates
 * 6. Shows success/expired state
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useDepositPayment, formatCountdown } from '@/hooks/useDepositPayment';

export interface InvoiceDepositFlowProps {
  baseTokenId: number;
  tokenSymbol: string;
  tokenName: string;
  networkName: string;
  onClose?: () => void;
}

export function InvoiceDepositFlow({
  baseTokenId,
  tokenSymbol,
  tokenName,
  networkName,
  onClose,
}: InvoiceDepositFlowProps) {
  const [amountInput, setAmountInput] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  const {
    deposit,
    secondsRemaining,
    isCreating,
    isPolling,
    isLoadingActive,
    error,
    isWaiting,
    isConfirming,
    isFinished,
    isExpired,
    createDeposit,
    reset,
    refreshStatus,
  } = useDepositPayment(baseTokenId);

  const handleCreateDeposit = async () => {
    const amount = amountInput ? parseFloat(amountInput) : undefined;
    await createDeposit(amount);
  };

  const handleCopyAddress = async () => {
    if (!deposit?.address) return;
    try {
      await navigator.clipboard.writeText(deposit.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCopyTag = async () => {
    if (!deposit?.extra_id) return;
    try {
      await navigator.clipboard.writeText(deposit.extra_id);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    } catch (err) {
      console.error('Failed to copy tag:', err);
    }
  };

  const handleNewDeposit = () => {
    reset();
    setAmountInput('');
  };

  // Loading state - Checking for existing active deposit
  if (isLoadingActive) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-4 text-sm text-text-secondary">
          Checking for active deposits...
        </p>
      </div>
    );
  }

  // STEP 1: Initial state - Amount input and create button
  if (!deposit) {
    return (
      <div className="space-y-4">
        {/* Info Card */}
        <Card className="p-3 bg-blue-500/10 border-blue-500/20">
          <div className="flex gap-2">
            <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900/90 dark:text-blue-100/90">
              <p className="font-medium mb-1">{tokenSymbol} requires a destination tag</p>
              <p>
                Each deposit generates a unique address + tag combination that expires.
                You must include the destination tag when sending.
              </p>
            </div>
          </div>
        </Card>

        {/* Amount Input (Optional) */}
        <div>
          <label className="text-xs text-text-tertiary mb-1.5 block">
            Amount in USD (Optional)
          </label>
          <Input
            type="number"
            placeholder="Leave empty for minimum amount"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="bg-bg-tertiary"
            min={0}
            step={0.01}
          />
          <p className="text-xs text-text-tertiary mt-1">
            You can deposit more than this amount
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-900/90 dark:text-red-100/90">
              {error.message}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleCreateDeposit}
          disabled={isCreating}
          className="w-full h-11"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            `Generate ${tokenSymbol} Deposit Address`
          )}
        </Button>
      </div>
    );
  }

  // STEP 3: Success state
  if (isFinished) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-green-500/10 border-green-500/20">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
              Deposit Received!
            </h3>
            <p className="text-sm text-green-600/80 dark:text-green-300/80 mt-1">
              {deposit.actually_paid} {tokenSymbol} has been credited to your account.
            </p>
            {deposit.tx_hash && (
              <p className="text-xs text-text-tertiary mt-2 font-mono">
                TX: {deposit.tx_hash.slice(0, 12)}...
              </p>
            )}
          </div>
        </Card>

        <Button onClick={onClose} className="w-full h-11" size="lg">
          Done
        </Button>

        <Button
          onClick={handleNewDeposit}
          variant="outline"
          className="w-full"
        >
          Make Another Deposit
        </Button>
      </div>
    );
  }

  // STEP 3b: Expired state
  if (isExpired) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-amber-500/10 border-amber-500/20">
          <div className="flex flex-col items-center text-center">
            <XCircle className="h-12 w-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
              Deposit Expired
            </h3>
            <p className="text-sm text-amber-600/80 dark:text-amber-300/80 mt-1">
              This deposit address has expired. Please generate a new one.
            </p>
          </div>
        </Card>

        <Button onClick={handleNewDeposit} className="w-full h-11" size="lg">
          Generate New Address
        </Button>
      </div>
    );
  }

  // STEP 2: Active deposit - Show address, tag, countdown
  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Confirming...
              </span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Waiting for deposit
              </span>
            </>
          )}
        </div>

        {/* Countdown Timer */}
        {secondsRemaining !== null && isWaiting && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-tertiary rounded-md">
            <Clock className="h-3.5 w-3.5 text-text-tertiary" />
            <span
              className={`text-sm font-mono font-medium ${
                secondsRemaining < 300
                  ? 'text-red-500'
                  : secondsRemaining < 600
                  ? 'text-amber-500'
                  : 'text-text-primary'
              }`}
            >
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* QR Code */}
      <Card className="p-4 bg-bg-secondary border-bg-tertiary">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-white p-3 rounded-xl">
            <QRCode
              value={deposit.address}
              size={160}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="text-xs text-text-tertiary">
            Scan to copy address
          </p>
        </div>
      </Card>

      {/* Expected/Minimum Amount */}
      <div className="p-2.5 bg-bg-tertiary rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">
            {deposit.is_minimum_amount ? 'Minimum Amount' : 'Expected Amount'}
          </span>
          <span className="text-sm font-medium">
            ~{deposit.expected_amount} {tokenSymbol}
          </span>
        </div>
        {deposit.is_minimum_amount && (
          <p className="text-xs text-text-tertiary mt-1">
            You can send any amount above this minimum
          </p>
        )}
      </div>

      {/* Address Display */}
      <div>
        <p className="text-xs text-text-tertiary mb-1.5">Deposit Address</p>
        <div className="flex rounded-xl bg-bg-tertiary border border-border overflow-hidden items-center">
          <div className="flex-1 px-3 py-2.5">
            <p className="text-xs font-mono break-all leading-relaxed">
              {deposit.address}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAddress}
            className={`mr-1 h-8 px-3 shrink-0 ${
              copiedAddress ? 'text-green-600' : ''
            }`}
          >
            {copiedAddress ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Destination Tag (REQUIRED) */}
      {deposit.extra_id && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tag className="h-3 w-3 text-amber-500" />
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Destination Tag (REQUIRED)
            </p>
          </div>
          <div className="flex rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden items-center">
            <div className="flex-1 px-3 py-2.5">
              <p className="text-lg font-mono font-bold text-amber-700 dark:text-amber-300">
                {deposit.extra_id}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTag}
              className={`mr-1 h-8 px-3 shrink-0 ${
                copiedTag
                  ? 'text-green-600'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {copiedTag ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1.5">
            You MUST include this tag when sending. Missing tag = lost funds!
          </p>
        </div>
      )}

      {/* Warning */}
      <div className="flex gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900/90 dark:text-amber-100/90">
          Only send {tokenSymbol} on <strong>{networkName}</strong>.
          This address expires in {formatCountdown(secondsRemaining)}.
        </p>
      </div>

      {/* Refresh Button */}
      <Button
        onClick={refreshStatus}
        variant="outline"
        className="w-full"
        disabled={isPolling}
      >
        {isPolling ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Checking...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </>
        )}
      </Button>

      {/* Cancel Button */}
      <Button
        onClick={handleNewDeposit}
        variant="ghost"
        className="w-full text-text-tertiary"
      >
        Cancel & Start Over
      </Button>
    </div>
  );
}

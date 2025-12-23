/**
 * Send Form Component
 * Modern form for entering send details with validation
 * Supports multi-network withdrawals with network selection
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import {
  useFeeEstimate,
  useAddressValidation,
  checkSufficientBalance,
} from '@/hooks/useSend';
import { useCoinPrice } from '@/hooks/useCoinPrices';
import { Loader2, AlertCircle, Clipboard, QrCode, Lock } from 'lucide-react';
import { formatUSD, formatCrypto } from '@/lib/utils/currency';
import Image from 'next/image';
import { QrScanner } from './QrScanner';
import { NetworkSelector } from '@/components/wallet/NetworkSelector';
import type { UserBalance } from '@/types/balance';

export interface SendFormProps {
  balance: UserBalance;
  onSubmit: (data: {
    toAddress: string;
    amount: string;
    estimatedFee: string;
    deploymentSymbol: string;
    networkCode: string;
  }) => void;
  onCancel: () => void;
}

export function SendForm({
  balance,
  onSubmit,
  onCancel,
}: SendFormProps) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Network selection - default to cheapest network
  const [selectedNetworkCode, setSelectedNetworkCode] = useState<string | null>(() => {
    const sorted = [...balance.deposit_addresses].sort(
      (a, b) => a.network.withdrawal_fee - b.network.withdrawal_fee
    );
    return sorted[0]?.network.code || null;
  });

  // Get selected deployment
  const selectedDeployment = useMemo(() =>
    balance.deposit_addresses.find(a => a.network.code === selectedNetworkCode),
    [balance.deposit_addresses, selectedNetworkCode]
  );

  const availableBalance = parseFloat(balance.available_balance);
  const lockedBalance = parseFloat(balance.locked_balance);
  const hasLockedBalance = lockedBalance > 0;

  const { validateAddress } = useAddressValidation();
  const { data: coinPrice } = useCoinPrice(balance.token.symbol);

  // Fetch fee estimate when address and amount are valid
  const feeParams =
    toAddress && amount && selectedDeployment && validateAddress(balance.token.symbol, toAddress)
      ? { coinSymbol: selectedDeployment.deployment.symbol, toAddress, amount }
      : null;

  const { data: feeData, isLoading: feeLoading, error: feeError } = useFeeEstimate(feeParams);

  const feeDataTyped = feeData as Record<string, unknown> | undefined;
  const estimatedFee = selectedDeployment
    ? String(selectedDeployment.network.withdrawal_fee)
    : feeDataTyped?.feeEstimate
    ? String((feeDataTyped.feeEstimate as Record<string, unknown>)?.fee || '0.00001')
    : '0.00001';

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToAddress(text.trim());
      setErrors((prev) => ({ ...prev, address: '' }));
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleQrScan = (scannedAddress: string) => {
    setToAddress(scannedAddress.trim());
    setErrors((prev) => ({ ...prev, address: '' }));
  };

  const handleMaxAmount = () => {
    // Set to available balance minus estimated fee
    const maxAmount = availableBalance - parseFloat(estimatedFee);
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(8));
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate network selection
    if (!selectedDeployment) {
      newErrors.network = 'Please select a network';
    }

    // Validate address
    if (!toAddress) {
      newErrors.address = 'Address is required';
    } else if (!validateAddress(balance.token.symbol, toAddress)) {
      newErrors.address = 'Invalid address format';
    }

    // Validate amount against AVAILABLE balance
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (!checkSufficientBalance(availableBalance, amount, estimatedFee, coinPrice?.current_price)) {
      newErrors.amount = 'Insufficient available balance (including fee)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedDeployment) return;

    onSubmit({
      toAddress,
      amount,
      estimatedFee,
      deploymentSymbol: selectedDeployment.deployment.symbol,
      networkCode: selectedDeployment.network.code,
    });
  };

  const parsedAmount = amount ? parseFloat(amount) : 0;
  const amountUsdValue = parsedAmount && coinPrice
    ? parsedAmount * coinPrice.current_price
    : 0;

  // Validation states
  const insufficientBalance = !checkSufficientBalance(availableBalance, amount, estimatedFee, coinPrice?.current_price);
  const hasAddressError = !!errors.address;
  const hasAmountError = !!errors.amount;
  const hasNetworkError = !!errors.network;

  // Button text logic
  const getButtonText = () => {
    if (feeLoading) return 'Calculating fee...';
    if (!toAddress) return 'Enter recipient address';
    if (hasAddressError) return 'Invalid address';
    if (!amount || parsedAmount <= 0) return 'Enter an amount';
    if (insufficientBalance) return 'Insufficient balance';
    return 'Continue';
  };

  const isSubmitDisabled =
    !toAddress ||
    !amount ||
    parsedAmount <= 0 ||
    hasAddressError ||
    hasAmountError ||
    insufficientBalance ||
    feeLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Network Selector - Primary */}
      <NetworkSelector
        depositAddresses={balance.deposit_addresses}
        selectedNetwork={selectedNetworkCode}
        onSelectNetwork={setSelectedNetworkCode}
        showFees={true}
        sortByFee={true}
        label="Choose Network"
        description="Select which network to send on (fees vary)"
      />

      {hasNetworkError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{errors.network}</AlertDescription>
        </Alert>
      )}

      {/* Balance Info - Secondary */}
      <div className="flex justify-between text-xs px-1">
        <span className="text-muted-foreground">Available</span>
        <div className="text-right">
          <div className="font-semibold">
            {formatCrypto(availableBalance, balance.token.symbol)} {balance.token.symbol}
          </div>
          {hasLockedBalance && (
            <div className="text-warning inline-flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" />
              {formatCrypto(lockedBalance, balance.token.symbol)} locked
            </div>
          )}
        </div>
      </div>

      <Card className="p-4 space-y-3 bg-bg-secondary border-bg-tertiary">
        {/* Address Section - Primary */}
        <div className="space-y-1.5">
          <label className="text-xs text-text-secondary">To Address</label>

          <div className="flex rounded-xl bg-bg-tertiary border border-border overflow-hidden items-center">
            <Input
              placeholder="Enter recipient address"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                setErrors((prev) => ({ ...prev, address: '' }));
              }}
              className={`flex-1 border-0 bg-transparent text-xs font-mono h-10 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 ${
                hasAddressError ? 'text-red-500' : ''
              }`}
            />

            <div className="flex gap-0.5 mr-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQrScannerOpen(true)}
                className="h-8 w-8"
                title="Scan QR"
              >
                <QrCode className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePaste}
                className="h-8 w-8"
                title="Paste"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {hasAddressError && (
            <div className="flex items-center gap-1 text-xs text-red-500 px-1">
              <AlertCircle className="h-3 w-3" />
              {errors.address}
            </div>
          )}
        </div>

        {/* Amount Section - Primary */}
        <div className="space-y-1.5">
          <label className="text-xs text-text-secondary">Amount</label>

          <div className="flex rounded-xl bg-bg-tertiary border border-border overflow-hidden h-12 items-center">
            <div className="flex items-center gap-1.5 px-3 border-r border-border/50">
              <Image
                src={balance.token.logo_url}
                alt={balance.token.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="font-semibold text-sm">{balance.token.symbol}</span>
            </div>

            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              className={`flex-1 border-0 bg-transparent text-right text-base font-semibold h-full rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none px-3 ${
                hasAmountError ? 'text-red-500' : ''
              }`}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMaxAmount}
              className="mr-1 h-8 px-2 text-xs font-semibold shrink-0"
            >
              Max
            </Button>
          </div>

          <div className="flex justify-between px-1">
            {amountUsdValue > 0 && (
              <span className="text-xs text-text-tertiary">{formatUSD(amountUsdValue)}</span>
            )}
            {hasAmountError && (
              <div className="flex items-center gap-1 text-xs text-red-500 ml-auto">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Fee Display - Secondary */}
      {selectedDeployment && (
        <div className="flex justify-between text-xs px-1">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="font-medium">
            {feeLoading ? (
              <Loader2 className="w-3 h-3 animate-spin inline" />
            ) : (
              `$${selectedDeployment.network.withdrawal_fee.toFixed(2)}`
            )}
          </span>
        </div>
      )}

      {feeError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <AlertDescription className="text-xs">Failed to estimate fee</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons - Primary */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11"
          disabled={isSubmitDisabled}
        >
          {getButtonText()}
        </Button>
      </div>

      {/* QR Scanner Modal */}
      <QrScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScan={handleQrScan}
        coinSymbol={balance.token.symbol}
        coinName={balance.token.name}
      />
    </form>
  );
}

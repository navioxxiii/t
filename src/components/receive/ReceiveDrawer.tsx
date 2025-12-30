/**
 * Receive Drawer Component
 * Modern bottom sheet for receiving crypto with QR code and address display
 * Supports multi-network token deposits with network selection
 *
 * For memo-based currencies (XRP, XLM), shows InvoiceDepositFlow instead
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Shield, Loader2, AlertCircle, Tag } from 'lucide-react';
import QRCode from 'react-qr-code';
import { NetworkSelector } from '@/components/wallet/NetworkSelector';
import type { UserBalance } from '@/types/balance';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { InvoiceDepositFlow } from './InvoiceDepositFlow';

/**
 * Currencies that require invoice-style deposits
 * These use memo/destination tags and cannot reuse addresses
 */
const INVOICE_REQUIRED_TOKENS = ['xrp', 'xlm'];

export interface ReceiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: UserBalance;
}

export function ReceiveDrawer({
  open,
  onOpenChange,
  balance,
}: ReceiveDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if this token requires invoice-style deposits
  const requiresInvoiceDeposit = useMemo(() => {
    const tokenCode = balance.token.code?.toLowerCase();
    return INVOICE_REQUIRED_TOKENS.includes(tokenCode);
  }, [balance.token.code]);

  // Initialize with first network
  const [selectedNetworkCode, setSelectedNetworkCode] = useState<string | null>(
    balance.deposit_addresses[0]?.network.code || null
  );

  // Get selected address based on network
  const selectedAddress = useMemo(() =>
    balance.deposit_addresses.find(a => a.network.code === selectedNetworkCode),
    [balance.deposit_addresses, selectedNetworkCode]
  );

  // Get network name for invoice flow
  const selectedNetworkName = useMemo(() => {
    return selectedAddress?.network.display_name || selectedAddress?.network.name || 'Network';
  }, [selectedAddress]);

  // Auto-generate addresses if missing
  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/wallets/generate', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        toast.success('Deposit addresses generated!');
        // Refetch balances to get new addresses
        queryClient.invalidateQueries({ queryKey: ['balances'] });
      } else {
        setGenerationError(data.error || 'Failed to generate addresses');
        toast.error(data.error || 'Failed to generate addresses');
      }
    } catch (error) {
      const errorMessage = 'An error occurred while generating addresses';
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on open if addresses are missing (skip for invoice-required tokens)
  useEffect(() => {
    if (open && balance.deposit_addresses.length === 0 && !isGenerating && !generationError && !requiresInvoiceDeposit) {
      handleAutoGenerate();
    }
  }, [open, balance.deposit_addresses.length, requiresInvoiceDeposit]);

  // Clear error when drawer closes
  useEffect(() => {
    if (!open) {
      setGenerationError(null);
    }
  }, [open]);

  const handleCopyAddress = async () => {
    if (!selectedAddress) return;

    try {
      await navigator.clipboard.writeText(selectedAddress.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCopyTag = async () => {
    if (!selectedAddress?.extra_id) return;

    try {
      await navigator.clipboard.writeText(selectedAddress.extra_id);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    } catch (err) {
      console.error('Failed to copy destination tag:', err);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] flex flex-col">
        <ResponsiveDialogHeader className="text-left shrink-0">
          <ResponsiveDialogTitle>Receive {balance.token.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Select network and share address to receive {balance.token.symbol}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {/* Loading State (only for non-invoice tokens) */}
          {isGenerating && !requiresInvoiceDeposit && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <p className="mt-4 text-sm text-text-secondary">
                Generating deposit addresses...
              </p>
              <p className="text-xs text-text-tertiary mt-2">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Error State */}
          {!isGenerating && generationError && !requiresInvoiceDeposit && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-action-red" />
              <p className="mt-4 text-sm text-text-primary">Failed to generate addresses</p>
              <p className="text-xs text-text-tertiary mt-2">{generationError}</p>
              <Button
                onClick={handleAutoGenerate}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Invoice Flow for memo-based currencies (XRP, XLM) */}
          {requiresInvoiceDeposit && (
            <InvoiceDepositFlow
              baseTokenId={balance.token.id}
              tokenSymbol={balance.token.symbol}
              tokenName={balance.token.name}
              networkName={selectedNetworkName}
              onClose={() => onOpenChange(false)}
            />
          )}

          {/* Normal State - Show addresses (for non-invoice tokens) */}
          {!isGenerating && !generationError && !requiresInvoiceDeposit && (
            <>
              {/* Network Selector - Primary */}
              <NetworkSelector
                depositAddresses={balance.deposit_addresses}
                selectedNetwork={selectedNetworkCode}
                onSelectNetwork={setSelectedNetworkCode}
                label="Network"
              />

              {selectedAddress && (
            <>
              {/* QR Code Section - Primary */}
              <Card className="p-4 bg-bg-secondary border-bg-tertiary">
                <div className="flex flex-col items-center justify-center space-y-3">
                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-xl">
                    <QRCode
                      value={selectedAddress.address}
                      size={180}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              </Card>

              {/* Address Display - Primary */}
              <div>
                <p className="text-xs text-text-tertiary mb-1.5">Deposit Address</p>
                <div className="flex rounded-xl bg-bg-tertiary border border-border overflow-hidden items-center">
                  {/* Address Text */}
                  <div className="flex-1 px-3 py-2.5">
                    <p className="text-xs font-mono break-all leading-relaxed">
                      {selectedAddress.address}
                    </p>
                  </div>

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className={`mr-1 h-8 px-3 shrink-0 ${
                      copied ? 'text-green-600' : ''
                    }`}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Destination Tag Display - For XRP, XLM, etc. */}
              {selectedAddress.extra_id && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Tag className="h-3 w-3 text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Destination Tag (Required)</p>
                  </div>
                  <div className="flex rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden items-center">
                    {/* Tag Text */}
                    <div className="flex-1 px-3 py-2.5">
                      <p className="text-sm font-mono font-semibold text-amber-700 dark:text-amber-300">
                        {selectedAddress.extra_id}
                      </p>
                    </div>

                    {/* Copy Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTag}
                      className={`mr-1 h-8 px-3 shrink-0 ${
                        copiedTag ? 'text-green-600' : 'text-amber-700 dark:text-amber-300'
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

              {/* Warning - Secondary */}
              <div className="flex gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900/90 dark:text-amber-100/90">
                  Only send {balance.token.symbol} on <strong>{selectedAddress.network.display_name}</strong>. Wrong network = loss of funds.
                </p>
              </div>

              {/* Action Button - Primary */}
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-11"
                size="lg"
              >
                Done
              </Button>
            </>
          )}
            </>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

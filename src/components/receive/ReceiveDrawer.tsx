/**
 * Receive Drawer Component
 * Modern bottom sheet for receiving crypto with QR code and address display
 * Supports multi-network token deposits with network selection
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
import { Copy, Check, Shield, Loader2, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { NetworkSelector } from '@/components/wallet/NetworkSelector';
import type { UserBalance } from '@/types/balance';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize with first network
  const [selectedNetworkCode, setSelectedNetworkCode] = useState<string | null>(
    balance.deposit_addresses[0]?.network.code || null
  );

  // Get selected address based on network
  const selectedAddress = useMemo(() =>
    balance.deposit_addresses.find(a => a.network.code === selectedNetworkCode),
    [balance.deposit_addresses, selectedNetworkCode]
  );

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

  // Auto-generate on open if addresses are missing
  useEffect(() => {
    if (open && balance.deposit_addresses.length === 0 && !isGenerating && !generationError) {
      handleAutoGenerate();
    }
  }, [open, balance.deposit_addresses.length]);

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
          {/* Loading State */}
          {isGenerating && (
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
          {!isGenerating && generationError && (
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

          {/* Normal State - Show addresses */}
          {!isGenerating && !generationError && (
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

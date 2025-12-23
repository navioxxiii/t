'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check } from 'lucide-react';
import { getCoinBySymbol, formatBalance } from '@/lib/constants/coins';
import { SendDrawer } from '@/components/send/SendDrawer';

interface WalletCardProps {
  coinSymbol: string;
  coinName: string;
  address: string;
  balance: string | number;
  network: string;
  qrCode?: string;
  isLoading?: boolean;
}

export default function WalletCard({
  coinSymbol,
  coinName,
  address,
  balance,
  network,
  qrCode,
  isLoading = false,
}: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const coin = getCoinBySymbol(coinSymbol);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Format address for display (show first 6 and last 6 characters)
  const formatAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

  // Format balance with appropriate decimals
  const formattedBalance = formatBalance(balance, coinSymbol);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded" />
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* QR Code Skeleton */}
          <div className="flex justify-center bg-white p-4 rounded-lg">
            <Skeleton className="w-32 h-32" />
          </div>

          {/* Address Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
              <Skeleton className="flex-1 h-5" />
              <Skeleton className="h-8 w-8 shrink-0" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Balance Skeleton */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="flex-1 h-9" />
            <Skeleton className="flex-1 h-9" />
          </div>

          {/* Full Address Skeleton */}
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{coin?.icon || coinSymbol[0]}</span>
            <div>
              <div className="text-lg font-bold">{coinName}</div>
              <div className="text-xs text-muted-foreground font-normal">
                {network}
              </div>
            </div>
          </div>
          <div className="text-sm font-mono bg-secondary px-2 py-1 rounded">
            {coinSymbol}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code */}
        {qrCode && (
          <div className="flex justify-center bg-white p-4 rounded-lg">
            <img
              src={qrCode}
              alt={`${coinSymbol} QR Code`}
              className="w-32 h-32"
            />
          </div>
        )}

        {/* Address */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Deposit Address
          </label>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
            <code className="flex-1 text-sm font-mono overflow-hidden text-ellipsis">
              {formatAddress(address)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Send {coinSymbol} to this address
          </p>
        </div>

        {/* Balance */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-lg font-bold font-mono">
              {formattedBalance} {coinSymbol}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            Receive
          </Button>
          {/* TODO: Update WalletCard to use unified balance system */}
          <SendDrawer
            balance={balance as any}
            trigger={
              <Button size="sm" className="flex-1">
                Send
              </Button>
            }
          />
        </div>

        {/* Full Address (expandable on click) */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View full address
          </summary>
          <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
            {address}
          </code>
        </details>
      </CardContent>
    </Card>
  );
}

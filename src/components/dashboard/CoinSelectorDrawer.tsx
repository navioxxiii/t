/**
 * Coin Selector Drawer Component
 * Reusable drawer for selecting a coin from user's wallets
 */

'use client';

import { useMemo } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { useBalances } from '@/hooks/useBalances';
import type { CoinPrice } from '@/lib/prices/prices-client';
import { formatCrypto, formatUSD } from '@/lib/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export interface CoinSelectorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCoin: (tokenId: number) => void;
  title: string;
  description: string;
  pricesMap?: Map<string, CoinPrice>;
  pricesLoading?: boolean;
}

export function CoinSelectorDrawer({
  open,
  onOpenChange,
  onSelectCoin,
  title,
  description,
  pricesMap,
  pricesLoading,
}: CoinSelectorDrawerProps) {
  const { data: balances, isLoading: balancesLoading } = useBalances();

  const isLoading = balancesLoading || pricesLoading;

  // Sort balances by USD value (highest first)
  const sortedBalances = useMemo(() => {
    if (!balances || !pricesMap) return balances ?? [];

    return [...balances].sort((a, b) => {
      const priceA = pricesMap.get(a.token.symbol);
      const priceB = pricesMap.get(b.token.symbol);
      const usdValueA = priceA ? parseFloat(a.balance) * priceA.current_price : 0;
      const usdValueB = priceB ? parseFloat(b.balance) * priceB.current_price : 0;
      return usdValueB - usdValueA;
    });
  }, [balances, pricesMap]);

  const handleSelectCoin = (tokenId: number) => {
    onSelectCoin(tokenId);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh]">
        <ResponsiveDialogHeader className="text-left">
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          )}

          {/* Balance List (sorted by USD value) */}
          {!isLoading && sortedBalances && sortedBalances.length > 0 && (
            <div className="space-y-2">
              {sortedBalances.map((balance) => {
                const price = pricesMap?.get(balance.token.symbol);
                const balanceAmount = parseFloat(balance.balance);
                const usdValue = price ? balanceAmount * price.current_price : 0;

                return (
                  <Button
                    key={balance.token.id}
                    variant="outline"
                    onClick={() => handleSelectCoin(balance.token.id)}
                    className="w-full h-auto p-4 justify-between hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={balance.token.logo_url}
                        alt={balance.token.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="text-left">
                        <p className="font-semibold">{balance.token.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCrypto(balanceAmount, balance.token.symbol)} {balance.token.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold">{formatUSD(usdValue)}</p>
                        {price && (
                          <p
                            className={`text-xs ${
                              price.price_change_percentage_24h > 0
                                ? 'text-green-600'
                                : price.price_change_percentage_24h < 0
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {price.price_change_percentage_24h > 0 ? '+' : ''}
                            {price.price_change_percentage_24h.toFixed(2)}%
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!balances || balances.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No balances found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generate wallets to get started
              </p>
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

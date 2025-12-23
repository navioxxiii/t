'use client';

import { useState, useMemo } from 'react';
import { CoinListItem } from './CoinListItem';
import { useFilteredBalances } from '@/hooks/useBalances';
import { useGenerateWallets } from '@/hooks/useWallets';
import type { CoinPrice } from '@/lib/prices/prices-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CoinListProps {
  onCoinClick?: (tokenId: number) => void;
  pricesMap?: Map<string, CoinPrice>;
  pricesLoading?: boolean;
  pricesError?: boolean;
}

export function CoinList({
  onCoinClick,
  pricesMap,
  pricesLoading,
  pricesError,
}: CoinListProps) {
  const { data: balances, isLoading: balancesLoading, refetch } = useFilteredBalances();
  const generateMutation = useGenerateWallets();

  const isLoading = balancesLoading || pricesLoading;
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleGenerateWallets = () => {
    generateMutation.mutate();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Empty state
  if (!isLoading && (!balances || balances.length === 0)) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {generateMutation.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : 'Failed to generate wallets'}
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-lg border border-bg-tertiary bg-bg-secondary">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-primary/10">
              <Wallet className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              No wallets yet
            </h3>
            <p className="mb-4 text-sm text-text-secondary max-w-md">
              Generate your cryptocurrency wallets to start receiving deposits.
              You&apos;ll get a unique address for each supported coin.
            </p>
            <Button
              onClick={handleGenerateWallets}
              disabled={generateMutation.isPending}
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Wallets...
                </>
              ) : (
                'Generate Wallets'
              )}
            </Button>
            {generateMutation.isPending && (
              <p className="text-sm text-text-tertiary mt-4">
                This may take a few moments...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Your Assets</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Token List */}
      <div className="overflow-hidden rounded-lg border border-bg-tertiary bg-bg-secondary">
        {isLoading ? (
          // Loading skeletons
          <>
            {[...Array(6)].map((_, i) => (
              <CoinListItem
                key={i}
                token={{
                  id: 0,
                  code: '',
                  symbol: '',
                  name: '',
                  token_type: '',
                  is_stablecoin: false,
                  decimals: 18,
                  icon: '',
                  logo_url: '',
                }}
                balance="0"
                locked_balance="0"
                available_balance="0"
                isLoading={true}
              />
            ))}
          </>
        ) : (
          // Actual token list (sorted by USD value)
          <>
            {sortedBalances.map((balance) => (
              <CoinListItem
                key={balance.token.id}
                token={balance.token}
                balance={balance.balance}
                locked_balance={balance.locked_balance}
                available_balance={balance.available_balance}
                price={pricesMap?.get(balance.token.symbol)}
                priceError={pricesError}
                onClick={() => onCoinClick?.(balance.token.id)}
                networkCount={balance.deposit_addresses?.length ?? 0}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

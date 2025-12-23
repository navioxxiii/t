'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WalletCard from '@/components/wallet/WalletCard';
import { Loader2, Wallet } from 'lucide-react';
import { useWallets, useGenerateWallets } from '@/hooks/useWallets';
import { useCoinPrices } from '@/hooks/useCoinPrices';
import { sortWalletsByUsdValue } from '@/lib/utils/walletSort';

export default function WalletsList() {
  const { data: wallets, isLoading, error, refetch } = useWallets();
  const generateMutation = useGenerateWallets();

  // Fetch prices for sorting
  const symbols = wallets?.map((w) => w.coin_symbol) ?? [];
  const { data: pricesMap } = useCoinPrices(symbols);

  // Sort wallets by USD value (highest balance first)
  const sortedWallets = useMemo(() => {
    if (!wallets) return [];
    return sortWalletsByUsdValue(wallets, pricesMap);
  }, [wallets, pricesMap]);

  const handleGenerateWallets = () => {
    generateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <WalletCard
            key={index}
            coinSymbol=""
            coinName=""
            address=""
            balance="0"
            network=""
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load wallets'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {generateMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {generateMutation.error instanceof Error
              ? generateMutation.error.message
              : 'Failed to generate wallets'}
          </AlertDescription>
        </Alert>
      )}

      {!wallets || wallets.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Wallets Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
            <p className="text-sm text-muted-foreground mt-4">
              This may take a few moments...
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              You have {wallets.length} cryptocurrency wallet
              {wallets.length !== 1 ? 's' : ''}. Share your addresses to
              receive deposits.
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size="sm"
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                coinSymbol={wallet.coin_symbol}
                coinName={wallet.coin_name}
                address={wallet.address}
                balance={wallet.balance}
                network={wallet.network}
                qrCode={wallet.qr_code}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

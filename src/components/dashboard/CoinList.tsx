'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CoinListItem } from './CoinListItem';
import { TokenPreferencesDialog } from './TokenPreferencesDialog';
import { useFilteredBalances } from '@/hooks/useBalances';
import type { CoinPrice } from '@/lib/prices/prices-client';
import type { UserBalance } from '@/types/balance';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ChevronDown, EyeOff, RefreshCw, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinListProps {
  onCoinClick?: (tokenId: number) => void;
  pricesMap?: Map<string, CoinPrice>;
  pricesLoading?: boolean;
  pricesError?: boolean;
  /** Opens the receive flow - offered on a wallet with nothing in it yet */
  onReceive?: () => void;
}

const OTHER_COINS_KEY = 'wallet-other-coins-open';

function readOtherCoinsOpen(): boolean {
  try {
    return localStorage.getItem(OTHER_COINS_KEY) === '1';
  } catch {
    return false;
  }
}

const SKELETON_TOKEN = {
  id: 0,
  code: '',
  symbol: '',
  name: '',
  token_type: '',
  is_stablecoin: false,
  decimals: 18,
  icon: '',
  logo_url: '',
};

export function CoinList({
  onCoinClick,
  pricesMap,
  pricesLoading,
  pricesError,
  onReceive,
}: CoinListProps) {
  const queryClient = useQueryClient();
  // DashboardClient shows the wallet set-up banner when there are no balances at all,
  // so an empty list here means the user has hidden every coin
  const { data: balances, isLoading: balancesLoading, refetch } = useFilteredBalances();

  const isLoading = balancesLoading || pricesLoading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [otherCoinsOpen, setOtherCoinsOpen] = useState(readOtherCoinsOpen);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Coins you hold first (by value; unpriced holdings right after priced ones, never
  // below empty coins), then the empty ones alphabetically
  const { held, empty } = useMemo(() => {
    const list = balances ?? [];
    const valueOf = (b: UserBalance) => {
      const price = pricesMap?.get(b.token.symbol);
      return price ? parseFloat(b.balance) * price.current_price : null;
    };
    const held = list
      .filter((b) => parseFloat(b.balance) > 0)
      .sort((a, b) => {
        const va = valueOf(a);
        const vb = valueOf(b);
        if (va !== null && vb !== null) return vb - va;
        if (va !== null) return -1;
        if (vb !== null) return 1;
        return a.token.symbol.localeCompare(b.token.symbol);
      });
    const empty = list
      .filter((b) => !(parseFloat(b.balance) > 0))
      .sort((a, b) => a.token.name.localeCompare(b.token.name));
    return { held, empty };
  }, [balances, pricesMap]);

  const toggleOtherCoins = () => {
    const next = !otherCoinsOpen;
    setOtherCoinsOpen(next);
    try {
      localStorage.setItem(OTHER_COINS_KEY, next ? '1' : '0');
    } catch {
      // Storage unavailable - the choice just won't be remembered
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Prices are what usually fails, so refresh them along with balances
    await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['coin-prices'] })]);
    setIsRefreshing(false);
  };

  const renderRow = (balance: UserBalance) => (
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
  );

  const allHidden = !isLoading && held.length === 0 && empty.length === 0;
  // Brand-new wallet: don't hide the only coins there are behind a collapsed row
  const showEmptyInline = held.length === 0;

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
          aria-label="Refresh balances and prices"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {allHidden ? (
        <div className="rounded-lg border border-bg-tertiary bg-bg-secondary px-4 py-10 text-center">
          <EyeOff className="mx-auto mb-3 h-8 w-8 text-text-tertiary" />
          <h3 className="mb-1 font-semibold text-text-primary">All coins are hidden</h3>
          <p className="mb-4 text-sm text-text-secondary">Choose which coins to show in your wallet.</p>
          <Button variant="outline" onClick={() => setPreferencesOpen(true)}>
            Manage coins
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Nothing held yet: point new users at receiving their first coins */}
          {!isLoading && showEmptyInline && (
            <div className="flex items-center gap-4 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/15">
                <Wallet className="h-5 w-5 text-brand-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary">Your wallet is ready</p>
                <p className="text-sm text-text-secondary">
                  Receive crypto from another wallet or exchange to get started.
                </p>
              </div>
              {onReceive && (
                <Button size="sm" className="shrink-0" onClick={onReceive}>
                  <ArrowDownLeft className="h-4 w-4" />
                  Receive
                </Button>
              )}
            </div>
          )}

          {/* Coins you hold (or every coin, on a brand-new wallet) */}
          <div className="overflow-hidden rounded-lg border border-bg-tertiary bg-bg-secondary">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <CoinListItem
                  key={i}
                  token={SKELETON_TOKEN}
                  balance="0"
                  locked_balance="0"
                  available_balance="0"
                  isLoading={true}
                />
              ))
            ) : showEmptyInline ? (
              empty.map(renderRow)
            ) : (
              held.map(renderRow)
            )}
          </div>

          {/* Coins with no balance, tucked away but one tap from their deposit address */}
          {!isLoading && !showEmptyInline && empty.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-bg-tertiary bg-bg-secondary">
              <button
                type="button"
                onClick={toggleOtherCoins}
                aria-expanded={otherCoinsOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Other coins ({empty.length})
                <ChevronDown className={cn('h-4 w-4 transition-transform', otherCoinsOpen && 'rotate-180')} />
              </button>
              {otherCoinsOpen && <div className="border-t border-bg-tertiary">{empty.map(renderRow)}</div>}
            </div>
          )}
        </div>
      )}

      <TokenPreferencesDialog open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}

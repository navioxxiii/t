/**
 * Staking Page
 * Stake proof-of-stake coins into the platform pool and track rewards
 */

'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Coins, Info, Layers, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { SummaryStat } from '@/components/shared/SummaryStat';
import { StakeDialog } from '@/components/staking/StakeDialog';
import { StakingPositionCard } from '@/components/staking/StakingPositionCard';
import { useBalances } from '@/hooks/useBalances';
import { useCoinPrices } from '@/hooks/useCoinPrices';
import { useStakingAssets, useStakingPositions, useUnstake } from '@/hooks/useStaking';
import { STAKING_ENABLED } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';
import { formatCrypto, formatUSD } from '@/lib/utils/currency';
import type { StakingAsset, StakingPosition } from '@/types/staking';

type Tab = 'stake' | 'positions';

function StakingContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const assetsQuery = useStakingAssets();
  const positionsQuery = useStakingPositions();
  const { data: balances } = useBalances();
  const unstake = useUnstake();

  const [staking, setStaking] = useState<StakingAsset | null>(null);
  const [unstaking, setUnstaking] = useState<StakingPosition | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const assets = assetsQuery.data ?? [];
  const positions = positionsQuery.data ?? [];
  const open = positions.filter((p) => p.status !== 'withdrawn');
  const history = positions.filter((p) => p.status === 'withdrawn');

  const symbols = Array.from(new Set([...assets.map((a) => a.token.symbol), ...positions.map((p) => p.token.symbol)]));
  const { data: prices } = useCoinPrices(symbols);
  const priceOf = (symbol: string) => prices?.get(symbol)?.current_price;
  const availableOf = (baseTokenId: number) =>
    Number(balances?.find((b) => b.token.id === baseTokenId)?.available_balance ?? 0);

  // Only show USD totals when every coin involved has a price - a missing price isn't $0
  const usdTotal = (list: StakingPosition[], field: 'amount' | 'rewards_total') =>
    list.every((p) => priceOf(p.token.symbol) !== undefined)
      ? list.reduce((sum, p) => sum + p[field] * (priceOf(p.token.symbol) ?? 0), 0)
      : null;
  const totalStakedUsd = usdTotal(open, 'amount');
  const totalRewardsUsd = usdTotal(positions, 'rewards_total');

  const tabParam = searchParams.get('tab');
  const tab: Tab = tabParam === 'stake' || tabParam === 'positions' ? tabParam : open.length > 0 ? 'positions' : 'stake';
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!STAKING_ENABLED) {
    return (
      <div className="mx-auto max-w-lg p-4 pt-12 text-center space-y-3">
        <Layers className="mx-auto h-10 w-10 text-text-tertiary" />
        <h1 className="text-xl font-bold">Staking is coming soon</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to wallet</Button>
      </div>
    );
  }

  const unstakeAsset = unstaking ? assets.find((a) => a.base_token_id === unstaking.base_token_id) : undefined;

  return (
    <div className="h-full p-4 pt-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Staking</h1>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Stake proof-of-stake coins you hold and earn network rewards in the same coin. Rewards vary.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-bg-tertiary" role="tablist">
          <div className="flex gap-8">
            {([
              { value: 'positions', label: 'My stakes', icon: Wallet, count: open.length },
              { value: 'stake', label: 'Stake', icon: Coins, count: assets.length },
            ] as const).map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'relative flex items-center gap-2 px-1 py-3 font-medium transition-colors',
                  tab === t.value ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none', tab === t.value ? 'bg-brand-primary/15 text-brand-primary' : 'bg-bg-tertiary text-text-secondary')}>
                    {t.count}
                  </span>
                )}
                {tab === t.value && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand-primary" />}
              </button>
            ))}
          </div>
        </div>

        {tab === 'stake' ? (
          <div className="space-y-4">
            {assetsQuery.isPending ? (
              <div className="grid gap-3 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
            ) : assetsQuery.isError ? (
              <Card><CardContent className="p-8 text-center space-y-3">
                <p className="text-action-red">{assetsQuery.error.message}</p>
                <Button variant="outline" size="sm" onClick={() => assetsQuery.refetch()}>Try again</Button>
              </CardContent></Card>
            ) : assets.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-text-secondary">No coins are open for staking yet.</CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {assets.map((asset) => {
                  const available = availableOf(asset.base_token_id);
                  return (
                    <Card key={asset.id} className="gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Image src={asset.token.logo_url || '/icons/crypto/default.svg'} alt={asset.token.symbol} width={36} height={36} className="rounded-full" />
                          <div>
                            <p className="font-semibold">{asset.token.symbol}</p>
                            <p className="text-xs text-text-tertiary">{asset.token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-brand-primary">
                            {asset.apy != null ? `${asset.apy.toFixed(2)}%` : '-'}
                          </p>
                          <p className="text-[11px] text-text-tertiary">{asset.apy_is_estimate ? 'Est. APY · variable' : 'APY (30d) · variable'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-bg-tertiary p-2"><p className="text-text-tertiary">Minimum</p><p className="font-semibold">{formatCrypto(asset.min_stake, asset.token.symbol)}</p></div>
                        <div className="rounded-md bg-bg-tertiary p-2"><p className="text-text-tertiary">Unstaking</p><p className="font-semibold">{asset.unbonding_days > 0 ? `${asset.unbonding_days} days` : 'Instant'}</p></div>
                        <div className="rounded-md bg-bg-tertiary p-2"><p className="text-text-tertiary">You have</p><p className="font-semibold truncate">{formatCrypto(available, asset.token.symbol)}</p></div>
                      </div>
                      <Button onClick={() => setStaking(asset)} disabled={available <= 0 || available < asset.min_stake}>
                        {available <= 0 ? `No ${asset.token.symbol} to stake` : available < asset.min_stake ? 'Below minimum' : `Stake ${asset.token.symbol}`}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3 rounded-lg border border-bg-tertiary p-4">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">
                Staked coins are pooled and staked on their networks. Rewards are shared out daily in proportion to your
                stake, after the platform commission, and depend on what the network actually pays.
              </p>
            </div>
          </div>
        ) : positionsQuery.isPending ? (
          <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-32" /></div>
        ) : positionsQuery.isError ? (
          <Card><CardContent className="p-8 text-center space-y-3">
            <p className="text-action-red">{positionsQuery.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => positionsQuery.refetch()}>Try again</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {positions.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat
                  icon={Wallet}
                  label="Staked value"
                  value={totalStakedUsd === null ? '-' : formatUSD(totalStakedUsd)}
                  sub={totalStakedUsd === null ? 'Price unavailable' : `${open.length} open stake(s)`}
                />
                <SummaryStat
                  icon={TrendingUp}
                  label="Rewards earned"
                  value={totalRewardsUsd === null ? '-' : `+${formatUSD(totalRewardsUsd)}`}
                  sub={totalRewardsUsd === null ? 'Price unavailable' : undefined}
                  valueClassName={totalRewardsUsd === null ? undefined : 'text-action-green'}
                />
              </div>
            )}

            {open.length === 0 ? (
              <Card><CardContent className="p-10 text-center space-y-4">
                <Layers className="mx-auto h-10 w-10 text-text-tertiary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">No active stakes</h3>
                  <p className="text-text-secondary">Stake a coin you hold to start earning rewards</p>
                </div>
                <Button onClick={() => setTab('stake')}>Browse coins</Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {open.map((position) => (
                  <StakingPositionCard key={position.id} position={position} price={priceOf(position.token.symbol)} onUnstake={setUnstaking} />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <section className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-expanded={showHistory}
                  className="flex items-center gap-2 text-lg font-semibold hover:text-brand-primary"
                >
                  History ({history.length})
                  <ChevronDown className={cn('h-5 w-5 transition-transform', showHistory && 'rotate-180')} />
                </button>
                {showHistory && history.map((position) => (
                  <StakingPositionCard key={position.id} position={position} price={priceOf(position.token.symbol)} />
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      <StakeDialog
        key={staking?.id ?? 'none'}
        asset={staking}
        available={staking ? availableOf(staking.base_token_id) : 0}
        price={staking ? priceOf(staking.token.symbol) : undefined}
        onClose={() => setStaking(null)}
      />

      {unstaking && (
        <ConfirmActionDialog
          open
          onOpenChange={(o) => !o && setUnstaking(null)}
          onConfirm={async () => {
            try {
              await unstake.mutateAsync(unstaking.id);
            } finally {
              setUnstaking(null);
            }
          }}
          title={`Unstake ${formatCrypto(unstaking.amount, unstaking.token.symbol)} ${unstaking.token.symbol}?`}
          description={
            unstakeAsset && unstakeAsset.unbonding_days > 0
              ? `Your coins stop earning now and return to your balance after ${unstakeAsset.unbonding_days} days.`
              : 'Your coins stop earning and return to your balance.'
          }
          confirmText="Unstake"
          loading={unstake.isPending}
        />
      )}
    </div>
  );
}

export default function StakingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl p-4 pt-8 space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-64" /></div>}>
      <StakingContent />
    </Suspense>
  );
}

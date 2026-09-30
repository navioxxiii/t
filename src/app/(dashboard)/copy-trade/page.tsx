/**
 * Copy Trade Page
 * Browse professional traders and view portfolio
 */

'use client';

import { Suspense, useEffect, useReducer } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UsersRound, Wallet, TrendingUp, History, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyTabs, type CopyTabValue } from '@/components/copy-trade/CopyTabs';
import { TradersGrid } from '@/components/copy-trade/TradersGrid';
import { CopyPositionCard } from '@/components/copy-trade/CopyPositionCard';
import { DemoBanner } from '@/components/copy-trade/DemoBanner';
import { SummaryStat } from '@/components/shared/SummaryStat';
import { useCopyPositions, useTraders } from '@/hooks/useCopyTrade';
import { formatChange, formatUSD } from '@/lib/utils/currency';
import type { PositionsData } from '@/types/copy-trade';

function PortfolioSummary({ summary }: { summary: PositionsData['summary'] }) {
  const pnl = summary.total_current_pnl;
  const pnlPercent = summary.total_invested > 0 ? (pnl / summary.total_invested) * 100 : 0;
  const lifetime = summary.total_lifetime_profit;
  const colorOf = (v: number) => (v >= 0 ? 'text-action-green' : 'text-action-red');

  return (
    <div className="grid grid-cols-2 gap-3">
      <SummaryStat
        icon={Wallet}
        label="Total Value"
        value={formatUSD(summary.total_current_value ?? summary.total_invested + pnl)}
        sub={`${formatUSD(summary.total_invested)} invested`}
      />
      <SummaryStat
        icon={TrendingUp}
        label="Current P&L"
        value={formatChange(pnl)}
        sub={formatChange(pnlPercent, true)}
        valueClassName={colorOf(pnl)}
      />
      <SummaryStat
        icon={History}
        label="Realized P&L"
        value={formatChange(lifetime)}
        valueClassName={colorOf(lifetime)}
      />
      <SummaryStat
        icon={Activity}
        label="Active Positions"
        value={String(summary.total_active_positions)}
      />
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function CopyTradeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tradersQuery = useTraders();
  const positionsQuery = useCopyPositions();
  const positions = positionsQuery.data;

  // Re-render every minute so "Updated Xm ago" stays accurate between refetches
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const activePositions = positions?.grouped.active ?? [];
  const closedPositions = positions
    ? [...positions.grouped.stopped, ...positions.grouped.liquidated].sort(
        (a, b) =>
          new Date(b.stopped_at ?? b.started_at).getTime() -
          new Date(a.stopped_at ?? a.started_at).getTime()
      )
    : [];
  const hasAnyPosition = activePositions.length > 0 || closedPositions.length > 0;

  // Tab lives in the URL; without one, send new users to the traders list
  const tabParam = searchParams.get('tab');
  const activeTab: CopyTabValue =
    tabParam === 'traders' || tabParam === 'portfolio'
      ? tabParam
      : positionsQuery.isSuccess && !hasAnyPosition
      ? 'traders'
      : 'portfolio';

  const setTab = (tab: CopyTabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const portfolioContent = positionsQuery.isPending ? (
    <PortfolioSkeleton />
  ) : positionsQuery.isError ? (
    <Card>
      <CardContent className="p-8 text-center space-y-3">
        <p className="text-action-red">{positionsQuery.error.message}</p>
        <Button variant="outline" size="sm" onClick={() => positionsQuery.refetch()}>
          Try again
        </Button>
      </CardContent>
    </Card>
  ) : !hasAnyPosition ? (
    <Card>
      <CardContent className="p-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
          <UsersRound className="h-8 w-8 text-text-tertiary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">No Positions Yet</h3>
          <p className="text-text-secondary">
            Start copying a trader to see your positions here
          </p>
        </div>
        <Button onClick={() => setTab('traders')}>Browse Traders</Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      <PortfolioSummary summary={positions!.summary} />

      {activePositions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Positions</h3>
          {activePositions.map((position) => (
            <CopyPositionCard
              key={position.id}
              position={position}
              updatedAt={positionsQuery.dataUpdatedAt}
            />
          ))}
        </div>
      )}

      {closedPositions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History</h3>
          {closedPositions.map((position) => (
            <CopyPositionCard key={position.id} position={position} />
          ))}
        </div>
      )}
    </div>
  );

  const traders = tradersQuery.data ?? [];
  const tradersContent = (
    <TradersGrid
      traders={traders}
      loading={tradersQuery.isPending}
      error={tradersQuery.isError ? tradersQuery.error.message : null}
      onRetry={() => tradersQuery.refetch()}
    />
  );

  return (
    <div className="min-h-screen p-4 pt-12 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <DemoBanner />

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Copy Trade</h1>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Copy professional traders and earn passive income
          </p>
        </div>

        {/* Tabbed Interface */}
        <CopyTabs
          value={activeTab}
          onValueChange={setTab}
          tradersContent={tradersContent}
          portfolioContent={portfolioContent}
          tradersCount={traders.length}
          portfolioCount={activePositions.length}
        />

        {/* Disclaimer */}
        <p className="text-xs text-text-tertiary">
          <strong>Risk Warning:</strong> Copy trading involves significant risk. Past performance
          does not guarantee future results. Performance fees are charged on profits only.
        </p>
      </div>
    </div>
  );
}

export default function CopyTradePage() {
  return (
    <Suspense fallback={null}>
      <CopyTradeContent />
    </Suspense>
  );
}

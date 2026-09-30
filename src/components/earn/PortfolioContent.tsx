/**
 * Portfolio Content Component
 * Summary plus claimable, active and withdrawn earn positions
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, CircleDollarSign, History, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { SummaryStat } from '@/components/shared/SummaryStat';
import { EarnPositionCard } from './EarnPositionCard';
import { useEarnClaim } from '@/hooks/useEarn';
import { cn } from '@/lib/utils';
import { formatChange, formatUSD } from '@/lib/utils/currency';
import { calcAccruedProfit } from '@/lib/earn/calc';
import { formatDuration } from '@/lib/earn/format';
import type { PositionWithDetails, PositionsResponse } from '@/types/earn';

interface PortfolioContentProps {
  data: PositionsResponse | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBrowseVaults: () => void;
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
      <Skeleton className="h-52 w-full" />
    </div>
  );
}

/** Re-render every second while there are active positions so accrual ticks live */
function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

export function PortfolioContent({ data, loading, error, onRetry, onBrowseVaults }: PortfolioContentProps) {
  const claimMutation = useEarnClaim();
  const [selectedPosition, setSelectedPosition] = useState<PositionWithDetails | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const active = data?.grouped.active ?? [];
  const claimable = data?.grouped.matured ?? [];
  const withdrawn = data?.grouped.withdrawn ?? [];
  const now = useNow(active.length > 0);

  if (loading) return <PortfolioSkeleton />;

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <p className="text-action-red">{error ?? 'Failed to load portfolio'}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasOpenPositions = active.length > 0 || claimable.length > 0;

  // Live totals, consistent with the per-card counters
  const liveProfit = active.reduce((sum, p) => sum + calcAccruedProfit(p, now), 0);
  const { total_invested, total_claimable, total_lifetime_earnings } = data.summary;
  const totalValue = total_invested + liveProfit + total_claimable;

  const handleConfirmClaim = async () => {
    if (!selectedPosition) return;
    try {
      await claimMutation.mutateAsync(selectedPosition.id);
    } catch {
      // Error toast is handled by the hook
    } finally {
      setSelectedPosition(null);
    }
  };

  return (
    <div className="space-y-6">
      {(hasOpenPositions || withdrawn.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryStat
            icon={Wallet}
            label="Total Value"
            value={formatUSD(totalValue)}
            sub={`${formatUSD(total_invested)} locked`}
          />
          <SummaryStat
            icon={TrendingUp}
            label="Earning Now"
            value={formatChange(liveProfit)}
            sub={`${active.length} active ${active.length === 1 ? 'position' : 'positions'}`}
            valueClassName="text-action-green"
          />
          <SummaryStat
            icon={CircleDollarSign}
            label="Ready to Claim"
            value={formatUSD(total_claimable)}
            valueClassName={total_claimable > 0 ? 'text-action-green' : undefined}
          />
          <SummaryStat
            icon={History}
            label="Lifetime Earnings"
            value={formatChange(total_lifetime_earnings)}
          />
        </div>
      )}

      {claimable.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Ready to Claim</h3>
          {claimable.map((position) => (
            <EarnPositionCard
              key={position.id}
              position={position}
              variant="claimable"
              onClaim={setSelectedPosition}
              claiming={claimMutation.isPending && claimMutation.variables === position.id}
            />
          ))}
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Active Positions</h3>
          {active.map((position) => (
            <EarnPositionCard key={position.id} position={position} variant="active" now={now} />
          ))}
        </section>
      )}

      {!hasOpenPositions && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
              <PiggyBank className="h-8 w-8 text-text-tertiary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No Active Positions</h3>
              <p className="text-text-secondary">Lock USDT in a vault to start earning a fixed APY</p>
            </div>
            <Button onClick={onBrowseVaults}>Browse Vaults</Button>
          </CardContent>
        </Card>
      )}

      {withdrawn.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            className="flex items-center gap-2 text-lg font-semibold hover:text-brand-primary transition-colors"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            aria-controls="earn-history"
          >
            History ({withdrawn.length})
            <ChevronDown className={cn('h-5 w-5 transition-transform', showHistory && 'rotate-180')} />
          </button>

          {showHistory && (
            <div id="earn-history" className="space-y-2">
              {withdrawn.map((position) => (
                <EarnPositionCard key={position.id} position={position} variant="withdrawn" />
              ))}
            </div>
          )}
        </section>
      )}

      {selectedPosition && (
        <ConfirmActionDialog
          open={selectedPosition !== null}
          onOpenChange={(open) => !open && setSelectedPosition(null)}
          onConfirm={handleConfirmClaim}
          title="Claim Investment"
          description={`Your investment in ${selectedPosition.vault.title} has matured. Principal and profit will be credited to your wallet.`}
          details={[
            { label: 'Vault', value: selectedPosition.vault.title },
            { label: 'Duration', value: formatDuration(selectedPosition.vault.duration_months, true) },
            { label: 'Principal', value: `${formatUSD(selectedPosition.amount_usdt)} USDT` },
            { label: 'Profit', value: `${formatChange(selectedPosition.total_profit_usdt)} USDT`, highlight: true },
            {
              label: 'Total Payout',
              value: `${formatUSD(selectedPosition.amount_usdt + selectedPosition.total_profit_usdt)} USDT`,
              highlight: true,
            },
          ]}
          confirmText="Claim Funds"
          loading={claimMutation.isPending}
        />
      )}
    </div>
  );
}

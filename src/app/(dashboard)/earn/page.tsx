/**
 * Earn Page
 * Browse fixed-term vaults and manage earn positions
 */

'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PiggyBank, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EarnTabs, type EarnTabValue } from '@/components/earn/EarnTabs';
import { VaultsGrid } from '@/components/earn/VaultsGrid';
import { PortfolioContent } from '@/components/earn/PortfolioContent';
import { useEarnPositions, useEarnVaults } from '@/hooks/useEarn';

function EarnContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const vaultsQuery = useEarnVaults();
  const positionsQuery = useEarnPositions();

  const vaults = vaultsQuery.data ?? [];
  const grouped = positionsQuery.data?.grouped;
  const openPositionsCount = grouped ? grouped.active.length + grouped.matured.length : 0;
  const hasAnyPosition = grouped
    ? openPositionsCount + grouped.withdrawn.length > 0
    : false;
  const maxApy = vaults.length > 0 ? Math.max(...vaults.map((v) => v.apy_percent)) : null;

  // Tab lives in the URL; without one, send new users to the vaults list
  const tabParam = searchParams.get('tab');
  const activeTab: EarnTabValue =
    tabParam === 'vaults' || tabParam === 'portfolio'
      ? tabParam
      : positionsQuery.isSuccess && !hasAnyPosition
      ? 'vaults'
      : 'portfolio';

  const setTab = (tab: EarnTabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="h-full p-4 pt-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Earn</h1>
            </div>
            {maxApy !== null && (
              <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs md:text-sm font-semibold text-brand-primary">
                Up to {maxApy}% APY
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Lock USDT in fixed-term vaults and earn a fixed APY, paid out with your principal at maturity
          </p>
        </div>

        <EarnTabs
          value={activeTab}
          onValueChange={setTab}
          vaultsCount={vaults.length}
          portfolioCount={openPositionsCount}
          vaultsContent={
            <div className="space-y-6">
              <VaultsGrid
                vaults={vaults}
                loading={vaultsQuery.isPending}
                error={vaultsQuery.isError ? vaultsQuery.error.message : null}
                onRetry={() => vaultsQuery.refetch()}
              />

              <div className="flex gap-3 rounded-lg border border-bg-tertiary p-4">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-text-tertiary" />
                <p className="text-xs text-text-tertiary">
                  Funds are locked for the full term and can&apos;t be withdrawn early. The APY is
                  fixed when you invest; principal and profit become claimable on the maturity date.
                </p>
              </div>
            </div>
          }
          portfolioContent={
            <PortfolioContent
              data={positionsQuery.data}
              loading={positionsQuery.isPending}
              error={positionsQuery.isError ? positionsQuery.error.message : null}
              onRetry={() => positionsQuery.refetch()}
              onBrowseVaults={() => setTab('vaults')}
            />
          }
        />
      </div>
    </div>
  );
}

export default function EarnPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full p-4 pt-8 pb-24">
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      }
    >
      <EarnContent />
    </Suspense>
  );
}

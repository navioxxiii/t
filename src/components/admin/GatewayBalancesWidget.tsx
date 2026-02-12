'use client';

import {
  useGatewayBalances,
  type GatewaySection,
  type PlisioBalanceItem,
  type NowPaymentsBalanceItem,
} from '@/hooks/useGatewayBalances';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Wallet, RefreshCw, Clock, Unlink } from 'lucide-react';

function formatTimeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TotalBalanceCard({ totalUsd }: { totalUsd: number | null }) {
  return (
    <div className="bg-brand-primary text-bg-primary rounded-xl p-5">
      <p className="text-sm opacity-80">Total Combined Balance</p>
      {totalUsd != null ? (
        <p className="text-3xl font-bold mt-1">{formatUsd(totalUsd)}</p>
      ) : (
        <p className="text-sm opacity-70 mt-1">Price data unavailable</p>
      )}
    </div>
  );
}

function NotConfiguredBody() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="bg-bg-tertiary rounded-full p-3 mb-3">
        <Unlink className="h-5 w-5 text-text-tertiary" />
      </div>
      <p className="text-sm font-semibold text-text-primary">Gateway Not Connected</p>
      <p className="text-xs text-text-tertiary mt-1">
        Configure your API keys to monitor balances.
      </p>
    </div>
  );
}

function PlisioCard({
  data,
  hasPrices,
}: {
  data: GatewaySection<PlisioBalanceItem>;
  hasPrices: boolean;
}) {
  const statusBadge = !data.configured ? (
    <Badge variant="secondary">Inactive</Badge>
  ) : data.error ? (
    <Badge variant="danger">Error</Badge>
  ) : (
    <Badge variant="success">Connected</Badge>
  );

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden flex flex-col">
      <div className="bg-bg-quaternary border-b border-bg-tertiary p-4 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-text-primary">Plisio</span>
        {statusBadge}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {!data.configured ? (
          <NotConfiguredBody />
        ) : data.error ? (
          <div className="p-4">
            <p className="text-sm text-action-red">{data.error}</p>
          </div>
        ) : data.balances.length === 0 ? (
          <div className="p-4">
            <p className="text-xs text-text-tertiary">No balances available</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-bg-tertiary hover:bg-transparent">
                <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider">
                  Asset
                </TableHead>
                <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider text-right">
                  Balance
                </TableHead>
                {hasPrices && (
                  <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider text-right">
                    Value (USD)
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balances.map((b) => (
                <TableRow key={b.psys_cid} className="border-bg-tertiary hover:bg-bg-tertiary/30">
                  <TableCell className="font-semibold text-text-primary">{b.currency}</TableCell>
                  <TableCell className="font-mono text-right text-text-primary">{b.balance}</TableCell>
                  {hasPrices && (
                    <TableCell className="text-right text-text-tertiary">
                      {b.usdValue != null ? formatUsd(b.usdValue) : '—'}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function NowPaymentsCard({
  data,
  hasPrices,
}: {
  data: GatewaySection<NowPaymentsBalanceItem>;
  hasPrices: boolean;
}) {
  const statusBadge = !data.configured ? (
    <Badge variant="secondary">Inactive</Badge>
  ) : data.error ? (
    <Badge variant="danger">Error</Badge>
  ) : (
    <Badge variant="success">Connected</Badge>
  );

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden flex flex-col">
      <div className="bg-bg-quaternary border-b border-bg-tertiary p-4 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-text-primary">NowPayments</span>
        {statusBadge}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {!data.configured ? (
          <NotConfiguredBody />
        ) : data.error ? (
          <div className="p-4">
            <p className="text-sm text-action-red">{data.error}</p>
          </div>
        ) : data.balances.length === 0 ? (
          <div className="p-4">
            <p className="text-xs text-text-tertiary">No balances available</p>
          </div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow className="border-bg-tertiary hover:bg-transparent">
              <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider">
                Asset
              </TableHead>
              <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider text-right">
                Balance
              </TableHead>
              {hasPrices && (
                <TableHead className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider text-right">
                  Value (USD)
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.balances.map((b) => (
              <TableRow key={b.currency} className="border-bg-tertiary hover:bg-bg-tertiary/30">
                <TableCell className="font-semibold text-text-primary">{b.currency}</TableCell>
                <TableCell className="font-mono text-right text-text-primary">
                  <div>{b.amount}</div>
                  {parseFloat(b.pendingAmount) > 0 && (
                    <div className="text-text-tertiary text-xs">+{b.pendingAmount} pending</div>
                  )}
                </TableCell>
                {hasPrices && (
                  <TableCell className="text-right text-text-tertiary">
                    {b.usdValue != null ? formatUsd(b.usdValue) : '—'}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Total balance skeleton */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Gateway cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-bg-tertiary rounded-xl overflow-hidden">
          <Skeleton className="h-14 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="border border-bg-tertiary rounded-xl overflow-hidden">
          <Skeleton className="h-14 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GatewayBalancesWidget() {
  const { data, isLoading, isError, error, isFetching, refetch } = useGatewayBalances();

  const hasPrices = data ? Object.keys(data.prices).length > 0 : false;

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-text-primary" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">Gateway Balances</h2>
            {data?.fetchedAt && (
              <p className="text-xs text-text-tertiary flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated: {formatTimeAgo(data.fetchedAt)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          aria-label="Refresh balances"
        >
          <RefreshCw className={`h-4 w-4 text-text-primary ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6">
          <p className="text-sm text-action-red">{error?.message || 'Failed to load balances'}</p>
        </div>
      ) : data ? (
        <>
          <TotalBalanceCard totalUsd={data.totalUsd} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlisioCard data={data.plisio} hasPrices={hasPrices} />
            <NowPaymentsCard data={data.nowpayments} hasPrices={hasPrices} />
          </div>
        </>
      ) : null}
    </section>
  );
}

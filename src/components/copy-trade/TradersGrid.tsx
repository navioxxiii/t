/**
 * TradersGrid Component
 * Sortable, filterable grid of trader cards with loading and error states
 */

'use client';

import { useMemo, useState } from 'react';
import { TraderCard } from './TraderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getMonthlyRoi, RISK_ORDER } from '@/lib/copy-trade/format';
import type { RiskLevel, Trader } from '@/types/copy-trade';

type SortKey = 'roi' | 'aum' | 'fee' | 'risk';
type RiskFilter = 'all' | RiskLevel;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'roi', label: 'Highest ROI' },
  { value: 'aum', label: 'Largest AUM' },
  { value: 'fee', label: 'Lowest fee' },
  { value: 'risk', label: 'Lowest risk' },
];

const RISK_FILTERS: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SORTERS: Record<SortKey, (a: Trader, b: Trader) => number> = {
  roi: (a, b) => getMonthlyRoi(b) - getMonthlyRoi(a),
  aum: (a, b) => b.aum_usdt - a.aum_usdt,
  fee: (a, b) => a.performance_fee_percent - b.performance_fee_percent,
  risk: (a, b) => (RISK_ORDER[a.risk_level] ?? 99) - (RISK_ORDER[b.risk_level] ?? 99),
};

interface TradersGridProps {
  traders: Trader[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function TradersGrid({ traders, loading, error, onRetry }: TradersGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('roi');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  const visibleTraders = useMemo(
    () =>
      traders
        .filter((t) => riskFilter === 'all' || t.risk_level === riskFilter)
        .filter((t) => !availableOnly || !t.availability.isFull)
        .sort(SORTERS[sortBy]),
    [traders, sortBy, riskFilter, availableOnly]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3 p-4 border border-bg-tertiary rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-1 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-action-red">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No traders available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-bg-tertiary p-1">
          {RISK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setRiskFilter(filter.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                riskFilter === filter.value
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAvailableOnly((v) => !v)}
          aria-pressed={availableOnly}
          className={cn(
            'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
            availableOnly
              ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
              : 'border-bg-tertiary text-text-secondary hover:text-text-primary'
          )}
        >
          Available only
        </button>

        <div className="ml-auto">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleTraders.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-text-secondary">No traders match these filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRiskFilter('all');
              setAvailableOnly(false);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTraders.map((trader) => (
            <TraderCard key={trader.id} trader={trader} />
          ))}
        </div>
      )}
    </div>
  );
}

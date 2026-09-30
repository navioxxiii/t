/**
 * Vaults Grid Component
 * Sortable, filterable grid of vault cards with loading and error states
 */

'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { VaultCard } from './VaultCard';
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
import type { VaultWithAvailability } from '@/types/earn';

type SortKey = 'apy' | 'shortest' | 'min';
type DurationFilter = 'all' | 1 | 3 | 6 | 12;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'apy', label: 'Highest APY' },
  { value: 'shortest', label: 'Shortest lock' },
  { value: 'min', label: 'Lowest minimum' },
];

const DURATION_FILTERS: { value: DurationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 1, label: '1M' },
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
];

const SORTERS: Record<SortKey, (a: VaultWithAvailability, b: VaultWithAvailability) => number> = {
  apy: (a, b) => b.apy_percent - a.apy_percent,
  shortest: (a, b) => a.duration_months - b.duration_months,
  min: (a, b) => a.min_amount - b.min_amount,
};

interface VaultsGridProps {
  vaults: VaultWithAvailability[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function VaultsGrid({ vaults, loading, error, onRetry }: VaultsGridProps) {
  const [sortBy, setSortBy] = useState<SortKey>('apy');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');

  // Only offer duration filters that match at least one vault
  const durationFilters = DURATION_FILTERS.filter(
    (f) => f.value === 'all' || vaults.some((v) => v.duration_months === f.value)
  );

  const visibleVaults = useMemo(
    () =>
      vaults
        .filter((v) => durationFilter === 'all' || v.duration_months === durationFilter)
        .sort((a, b) =>
          // Full vaults always sink to the bottom
          Number(a.availability.isFull) - Number(b.availability.isFull) || SORTERS[sortBy](a, b)
        ),
    [vaults, sortBy, durationFilter]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4 p-5 border border-bg-tertiary rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-9 w-24" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
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

  if (vaults.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-text-tertiary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">No Vaults Available</h3>
          <p className="text-text-secondary">Check back later for new opportunities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {durationFilters.length > 2 && (
          <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-bg-tertiary p-1">
            {durationFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={durationFilter === filter.value}
                onClick={() => setDurationFilter(filter.value)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  durationFilter === filter.value
                    ? 'bg-bg-secondary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto shrink-0">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger size="sm" className="h-8 w-[124px] text-xs">
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

      {visibleVaults.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-text-secondary">No vaults match this lock period.</p>
          <Button variant="outline" size="sm" onClick={() => setDurationFilter('all')}>
            Show all vaults
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleVaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </div>
      )}
    </div>
  );
}

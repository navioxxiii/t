/**
 * VaultCard Component
 * Summary card for a single earn vault, linking to its detail page
 */

import Link from 'next/link';
import { ArrowRight, Clock, Lock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/utils/currency';
import { calcTotalProfit } from '@/lib/earn/calc';
import { formatDuration, getRiskColor } from '@/lib/earn/format';
import type { VaultWithAvailability } from '@/types/earn';

const EXAMPLE_AMOUNT = 1000;

export function VaultCard({ vault }: { vault: VaultWithAvailability }) {
  const isFull = vault.availability.isFull;
  const exampleProfit = calcTotalProfit(EXAMPLE_AMOUNT, vault.apy_percent, vault.duration_months);
  const fill = Math.min(vault.availability.fillPercentage, 100);

  return (
    <Link
      href={`/earn/${vault.id}`}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
    >
      <Card
        className={cn(
          'h-full gap-4 p-5 transition-all',
          isFull ? 'opacity-60' : 'hover:border-brand-primary/50 md:hover:shadow-lg'
        )}
      >
        {/* Title + risk */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm md:text-base truncate">{vault.title}</h3>
            {vault.subtitle && (
              <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{vault.subtitle}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0 text-[10px] px-1.5 py-0 font-semibold uppercase', getRiskColor(vault.risk_level))}
          >
            {vault.risk_level}
          </Badge>
        </div>

        {/* APY */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-text-tertiary">Fixed APY</p>
            <p className="text-2xl md:text-3xl font-bold text-brand-primary leading-tight">
              {vault.apy_percent}%
            </p>
          </div>
          <p className="text-right text-xs text-text-tertiary">
            {formatUSD(EXAMPLE_AMOUNT, { minimumFractionDigits: 0 })} earns
            <span className="block text-sm font-semibold text-action-green">
              +{formatUSD(exampleProfit)}
            </span>
          </p>
        </div>

        {/* Terms */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-md bg-bg-tertiary p-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
            <div>
              <p className="text-text-tertiary">Lock period</p>
              <p className="font-semibold">{formatDuration(vault.duration_months, true)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-bg-tertiary p-2">
            <Lock className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
            <div>
              <p className="text-text-tertiary">Min / Max</p>
              <p className="font-semibold">
                {formatUSD(vault.min_amount, { minimumFractionDigits: 0 })}
                {' – '}
                {vault.max_amount ? formatUSD(vault.max_amount, { minimumFractionDigits: 0, compact: true }) : 'No limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Capacity */}
        {vault.total_capacity !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-text-tertiary">
              <span>Capacity</span>
              <span>{isFull ? 'Full' : `${fill.toFixed(0)}% filled`}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className={cn('h-full rounded-full', isFull ? 'bg-action-red' : 'bg-brand-primary')}
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA (visual only - the whole card is the link) */}
        <div
          className={cn(
            'mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium',
            isFull ? 'border border-bg-tertiary text-text-secondary' : 'bg-brand-primary text-bg-primary group-hover:bg-brand-primary-dark'
          )}
        >
          {isFull ? (
            'Capacity Full'
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Invest Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}

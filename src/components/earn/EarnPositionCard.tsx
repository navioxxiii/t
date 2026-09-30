/**
 * EarnPositionCard Component
 * A single earn position: active (live accrual), claimable, or withdrawn
 */

'use client';

import { Activity, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatChange, formatUSD } from '@/lib/utils/currency';
import { calcAccruedProfit, getPositionProgress } from '@/lib/earn/calc';
import { formatDate, formatDuration, formatTimeRemaining } from '@/lib/earn/format';
import type { PositionWithDetails } from '@/types/earn';

export type EarnPositionVariant = 'active' | 'claimable' | 'withdrawn';

interface EarnPositionCardProps {
  position: PositionWithDetails;
  variant: EarnPositionVariant;
  /** Current time from the parent's ticker - drives live accrual for active positions */
  now?: number;
  onClaim?: (position: PositionWithDetails) => void;
  claiming?: boolean;
}

function Stat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <div className={cn('font-semibold text-sm md:text-base truncate', className)}>{value}</div>
    </div>
  );
}

export function EarnPositionCard({ position, variant, now, onClaim, claiming }: EarnPositionCardProps) {
  const principal = position.amount_usdt;
  const totalProfit = position.total_profit_usdt;
  const payout = principal + totalProfit;
  const vaultTerms = `${position.vault.apy_percent}% APY · ${formatDuration(position.vault.duration_months, true)}`;

  if (variant === 'withdrawn') {
    return (
      <Card className="gap-0 p-4 opacity-70">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{position.vault.title}</p>
            <p className="text-xs text-text-tertiary">
              {vaultTerms} · Claimed {position.withdrawn_at ? formatDate(position.withdrawn_at) : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-action-green">{formatChange(totalProfit)}</p>
            <p className="text-xs text-text-tertiary">on {formatUSD(principal)}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'claimable') {
    return (
      <Card className="gap-4 p-5 border-action-green/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{position.vault.title}</p>
            <p className="text-xs text-text-tertiary">{vaultTerms}</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-action-green shrink-0">
            <CheckCircle className="h-4 w-4" />
            Matured
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg bg-action-green/10 p-3">
          <Stat label="Principal" value={formatUSD(principal)} />
          <Stat label="Profit" value={formatChange(totalProfit)} className="text-action-green" />
          <Stat label="Total" value={formatUSD(payout)} className="text-action-green" />
        </div>

        <Button
          className="w-full bg-action-green hover:bg-action-green-dark"
          onClick={() => onClaim?.(position)}
          disabled={claiming}
        >
          {claiming ? 'Processing...' : `Claim ${formatUSD(payout)}`}
        </Button>
      </Card>
    );
  }

  // Active: recompute from timestamps each tick so the counter never drifts
  // (falls back to the server's snapshot when no ticker is passed)
  const accrued = now !== undefined ? calcAccruedProfit(position, now) : position.calculated.current_profit;
  const progress = now !== undefined ? getPositionProgress(position, now) : position.calculated;

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{position.vault.title}</p>
          <p className="text-xs text-text-tertiary">{vaultTerms}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-text-secondary shrink-0">
          <Clock className="h-3.5 w-3.5" />
          {formatTimeRemaining(progress.days_remaining, progress.hours_remaining)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div
          className="h-2 rounded-full bg-bg-tertiary overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress.progress_percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Lock period progress"
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-[width] duration-1000"
            style={{ width: `${progress.progress_percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-text-tertiary">
          <span>Started {formatDate(position.invested_at)}</span>
          <span>Matures {formatDate(position.matures_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-lg bg-bg-tertiary p-3">
        <Stat label="Invested" value={formatUSD(principal)} />
        <Stat
          label="Earned so far"
          className="text-action-green tabular-nums"
          value={
            <span className="inline-flex items-center gap-1">
              +{formatUSD(accrued, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              <Activity className="h-3 w-3 animate-pulse" aria-hidden />
            </span>
          }
        />
        <Stat label="At maturity" value={formatUSD(payout)} className="text-brand-primary" />
      </div>
    </Card>
  );
}

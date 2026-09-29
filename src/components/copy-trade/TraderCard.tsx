/**
 * TraderCard Component
 * Compact trader summary: identity, monthly ROI, key stats and capacity
 */

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Activity, Check } from 'lucide-react';
import Link from 'next/link';
import { TraderAvatar } from './TraderAvatar';
import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/utils/currency';
import { getMonthlyRoi, getRiskColor } from '@/lib/copy-trade/format';
import type { Trader } from '@/types/copy-trade';

interface TraderCardProps {
  trader: Trader;
}

export function TraderCard({ trader }: TraderCardProps) {
  const monthlyRoi = getMonthlyRoi(trader);
  const isPositive = monthlyRoi >= 0;
  const isFull = trader.availability.isFull;
  const detailHref = `/copy-trade/${trader.id}`;

  const stats = [
    { label: 'AUM', value: formatUSD(trader.aum_usdt, { compact: true }) },
    { label: 'Copiers', value: `${trader.current_copiers}/${trader.max_copiers}` },
    { label: 'Fee', value: `${trader.performance_fee_percent}%` },
    {
      label: 'Max DD',
      value: `-${(trader.max_drawdown * 100).toFixed(1)}%`,
      className: 'text-action-red',
    },
  ];

  return (
    <Card
      className={cn(
        'gap-0 py-0 overflow-hidden transition-colors',
        trader.isUserCopying && 'border-brand-primary/50'
      )}
    >
      <Link href={detailHref} className="block p-4 space-y-3">
        {/* Header: avatar, name, ROI */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <TraderAvatar name={trader.name} src={trader.avatar_url} className="h-11 w-11" />
            {trader.isUserCopying && (
              <div className="absolute -bottom-1 -right-1 bg-brand-primary rounded-full p-0.5 ring-2 ring-bg-secondary">
                <Activity className="h-3 w-3 text-bg-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-semibold text-sm md:text-base truncate">{trader.name}</p>
              <Badge
                variant="outline"
                className={cn('shrink-0 text-[10px] px-1.5 py-0 font-semibold', getRiskColor(trader.risk_level))}
              >
                {trader.risk_level.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-text-tertiary truncate" title={trader.strategy}>
              {trader.strategy}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p
              className={cn(
                'text-lg md:text-xl font-bold leading-tight',
                isPositive ? 'text-action-green' : 'text-action-red'
              )}
            >
              {isPositive ? '+' : ''}
              {monthlyRoi.toFixed(2)}%
            </p>
            <p className="text-[10px] text-text-tertiary">Monthly ROI</p>
          </div>
        </div>

        {/* Bio */}
        {trader.bio && (
          <p className="text-xs text-text-secondary line-clamp-1">{trader.bio}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-bg-tertiary p-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className="text-[10px] text-text-tertiary">{stat.label}</p>
              <p className={cn('text-xs md:text-sm font-semibold truncate', stat.className)}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>Capacity</span>
            <span>
              {isFull
                ? 'Full'
                : Number.isFinite(trader.availability.remainingCapacity)
                ? `${trader.availability.remainingCapacity} ${trader.availability.remainingCapacity === 1 ? 'spot' : 'spots'} left`
                : 'Open'}
            </span>
          </div>
          <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isFull ? 'bg-text-tertiary' : 'bg-brand-primary'
              )}
              style={{ width: `${Math.min(trader.availability.fillPercentage || 0, 100)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Action */}
      <div className="px-4 pb-4">
        {trader.isUserCopying ? (
          <Button asChild className="w-full group" size="sm">
            <Link href="/copy-trade?tab=portfolio">
              Manage Position
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        ) : trader.isUserOnWaitlist ? (
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href={detailHref}>
              <Check className="h-4 w-4 text-brand-primary" />
              <span className="text-brand-primary">On Waitlist</span>
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant={isFull ? 'outline' : 'default'}
            className="w-full group"
            size="sm"
          >
            <Link href={detailHref}>
              {isFull ? 'Join Waitlist' : 'Copy Trader'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

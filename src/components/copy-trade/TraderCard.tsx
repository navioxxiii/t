/**
 * TraderCard Component
 * Displays trader information with all key metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, Percent, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Trader {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  historical_roi_min: number;
  historical_roi_max: number;
  risk_level: 'low' | 'medium' | 'high';
  strategy: string;
  aum_usdt: number;
  current_copiers: number;
  max_copiers: number;
  performance_fee_percent: number;
  max_drawdown: number;
  stats: {
    monthly_roi?: number;
    win_rate?: number;
    avg_hold_time_hours?: number;
  };
  availability: {
    isFull: boolean;
    fillPercentage: number;
    remainingCapacity: number | null;
  };
  isUserCopying?: boolean;
  isUserOnWaitlist?: boolean;
}

interface TraderCardProps {
  trader: Trader;
}

export function TraderCard({ trader }: TraderCardProps) {
  const monthlyRoi = trader.stats?.monthly_roi ||
    ((trader.historical_roi_min + trader.historical_roi_max) / 2);
  const isPositive = monthlyRoi >= 0;
  const isFull = trader.availability.isFull;

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-action-green/10 text-action-green border-action-green/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'high':
        return 'bg-action-red/10 text-action-red border-action-red/30';
      default:
        return 'bg-bg-tertiary text-text-secondary';
    }
  };

  // Format large numbers
  const formatAUM = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className={`transition-all duration-200 hover:border-brand-primary/50 md:hover:scale-[1.02] md:hover:shadow-lg ${
      trader.isUserCopying ? 'border-brand-primary/50' : ''
    }`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {/* Avatar with Copying Badge */}
          <div className="relative">
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-bg-tertiary flex-shrink-0">
              <Image
                src={trader.avatar_url || '/placeholder-avatar.png'}
                alt={trader.name}
                fill
                className="object-cover"
              />
            </div>
            {trader.isUserCopying && (
              <div className="absolute -bottom-1 -right-1 bg-brand-primary rounded-full p-1">
                <Activity className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Name & Strategy */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm md:text-base mb-1">{trader.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {trader.strategy}
            </Badge>
          </div>

          {/* Risk Badge */}
          <Badge
            variant="outline"
            className={`${getRiskColor(trader.risk_level)} text-xs font-semibold`}
          >
            {trader.risk_level.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        <p className="text-sm text-text-secondary line-clamp-2">
          {trader.bio}
        </p>

        {/* Monthly ROI - Highlighted */}
        <div className="p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Monthly ROI</span>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-action-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-action-red" />
              )}
              <span
                className={`text-sm md:text-base font-bold ${
                  isPositive ? 'text-action-green' : 'text-action-red'
                }`}
              >
                {isPositive ? '+' : ''}
                {monthlyRoi.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* AUM */}
          <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
            <DollarSign className="h-4 w-4 text-text-tertiary shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">AUM</p>
              <p className="font-semibold text-sm">{formatAUM(trader.aum_usdt)}</p>
            </div>
          </div>

          {/* Copiers */}
          <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
            <Users className="h-4 w-4 text-text-tertiary shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">Copiers</p>
              <p className="font-semibold text-sm">
                {trader.current_copiers} / {trader.max_copiers}
                {isFull && (
                  <span className="ml-1 text-xs text-text-tertiary font-normal">Full</span>
                )}
              </p>
            </div>
          </div>

          {/* Performance Fee */}
          <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
            <Percent className="h-4 w-4 text-text-tertiary shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">Performance Fee</p>
              <p className="font-semibold text-sm">{trader.performance_fee_percent}%</p>
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
            <AlertTriangle className="h-4 w-4 text-text-tertiary shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">Max Drawdown</p>
              <p className="font-semibold text-sm text-action-red">
                -{(trader.max_drawdown * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Capacity Bar (if limited) */}
        {trader.availability.fillPercentage > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Capacity</span>
              <span>{trader.availability.fillPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  isFull ? 'bg-text-tertiary' : 'bg-brand-primary'
                }`}
                style={{ width: `${Math.min(trader.availability.fillPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Risk Warning */}
        <p className="flex items-center text-xs text-text-tertiary">
          <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
          Returns may fluctuate. Past performance ≠ future results.
        </p>

        {/* Action Button */}
        <Link href={trader.isUserCopying ? '/copy-trade' : `/copy-trade/${trader.id}`} className="block">
          <Button
            className="w-full group"
            variant={
              trader.isUserCopying
                ? 'default'
                : trader.isUserOnWaitlist
                ? 'outline'
                : isFull
                ? 'outline'
                : 'default'
            }
          >
            {trader.isUserCopying ? (
              <>
                Manage Position
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            ) : trader.isUserOnWaitlist ? (
              <span className="text-brand-primary">On Waitlist ✓</span>
            ) : isFull ? (
              <>
                Join Waitlist
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                Copy Trader
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

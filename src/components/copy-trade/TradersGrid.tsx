/**
 * TradersGrid Component
 * Grid display of trader cards with loading and error states
 */

'use client';

import { TraderCard } from './TraderCard';
import { Skeleton } from '@/components/ui/skeleton';

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

interface TradersGridProps {
  traders: Trader[];
  loading?: boolean;
  error?: string | null;
}

export function TradersGrid({ traders, loading, error }: TradersGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-tertiary text-center">Loading traders...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 p-6 border border-bg-tertiary rounded-lg"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-action-red">{error}</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {traders.map((trader) => (
        <TraderCard key={trader.id} trader={trader} />
      ))}
    </div>
  );
}

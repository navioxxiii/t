/**
 * Copy Trade Page
 * Browse professional traders and view portfolio
 */

'use client';

import { useEffect, useState } from 'react';
import { UsersRound, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CopyTabs } from '@/components/copy-trade/CopyTabs';
import { TradersGrid } from '@/components/copy-trade/TradersGrid';
import { CopyPositionCard } from '@/components/copy-trade/CopyPositionCard';

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
}

interface Position {
  id: string;
  allocation_usdt: number;
  current_pnl: number;
  daily_pnl_rate: number;
  status: 'active' | 'stopped' | 'liquidated';
  started_at: string;
  stopped_at?: string;
  final_pnl?: number;
  performance_fee_paid?: number;
  trader: {
    id: string;
    name: string;
    avatar_url: string;
    strategy: string;
    performance_fee_percent: number;
    risk_level: string;
  };
}

interface PositionsData {
  grouped: {
    active: Position[];
    stopped: Position[];
    liquidated: Position[];
  };
  summary: {
    total_active_positions: number;
    total_invested: number;
    total_current_pnl: number;
    total_lifetime_profit: number;
  };
}

export default function CopyTradePage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [positions, setPositions] = useState<PositionsData | null>(null);
  const [loadingTraders, setLoadingTraders] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTraders();
    fetchPositions();

    // Auto-refresh positions every 5 minutes (matches tick-cron schedule)
    const refreshInterval = setInterval(() => {
      fetchPositions();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await fetch('/api/copy-trade/traders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch traders');
      }

      setTraders(data.traders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingTraders(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/copy-trade/positions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      setPositions(data);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoadingPositions(false);
    }
  };

  // Find top ROI for quick stat
  const topRoi = traders.length > 0
    ? Math.max(...traders.map((t) => t.stats?.monthly_roi || t.historical_roi_max))
    : 0;

  // Portfolio Content
  const portfolioContent = (
    <div className="space-y-6">
      {/* Summary Stats */}
      {positions && positions.summary.total_active_positions > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Total Invested</p>
                  <p className="text-base md:text-lg font-bold">
                    ${positions.summary.total_invested.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-action-green/10 p-2">
                  <TrendingUp className="h-5 w-5 text-action-green" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Current P&L</p>
                  <p className={`text-base md:text-lg font-bold ${
                    positions.summary.total_current_pnl >= 0 ? 'text-action-green' : 'text-action-red'
                  }`}>
                    {positions.summary.total_current_pnl >= 0 ? '+' : ''}
                    ${positions.summary.total_current_pnl.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Positions */}
      {positions && positions.grouped.active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Positions</h3>
          <div className="space-y-4">
            {positions.grouped.active.map((position) => (
              <CopyPositionCard
                key={position.id}
                position={position}
                onStop={fetchPositions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stopped Positions */}
      {positions && positions.grouped.stopped.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="space-y-4">
            {positions.grouped.stopped.map((position) => (
              <CopyPositionCard key={position.id} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {positions && positions.grouped.active.length === 0 && positions.grouped.stopped.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
              <UsersRound className="h-8 w-8 text-text-tertiary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No Active Positions</h3>
              <p className="text-text-secondary">
                Start copying a trader to see your positions here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Traders Content
  const tradersContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm md:text-base font-semibold">Top Traders</h2>
        <p className="text-sm text-text-secondary">
          {loadingTraders ? '...' : `${traders.length} ${traders.length === 1 ? 'trader' : 'traders'}`}
        </p>
      </div>

      <TradersGrid traders={traders} loading={loadingTraders} error={error} />

      {/* Disclaimer */}
      {!loadingTraders && traders.length > 0 && (
        <Card className="border-bg-tertiary/50">
          <CardContent className="p-4 text-xs text-text-tertiary">
            <p>
              <strong>Risk Warning:</strong> Copy trading involves significant risk. Past performance
              does not guarantee future results. Performance fees are charged on profits only.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 pt-12 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Copy Trade</h1>
          </div>
          <p className="text-xs md:text-sm text-text-secondary">
            Copy professional traders and earn passive income
          </p>
        </div>

        {/* Quick Stat */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Top Monthly ROI</p>
                <p className="text-base md:text-lg font-bold text-brand-primary">
                  +{topRoi.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Interface */}
        <CopyTabs
          tradersContent={tradersContent}
          portfolioContent={portfolioContent}
        />
      </div>
    </div>
  );
}

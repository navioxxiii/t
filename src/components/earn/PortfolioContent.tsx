/**
 * Portfolio Content Component
 * Displays user's earn positions (active, matured, withdrawn)
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Clock, CheckCircle, Activity, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

interface Position {
  id: string;
  vault_id: string;
  amount_usdt: number;
  daily_profit_rate: number;
  total_profit_usdt: number;
  status: 'active' | 'matured' | 'withdrawn';
  invested_at: string;
  matures_at: string;
  withdrawn_at: string | null;
  vault: {
    title: string;
    apy_percent: number;
    duration_months: number;
    risk_level: string;
  };
  calculated: {
    current_profit: number;
    days_elapsed: number;
    days_remaining: number;
    hours_remaining: number;
    progress_percentage: number;
    is_matured: boolean;
  };
}

interface PositionsData {
  grouped: {
    active: Position[];
    matured: Position[];
    withdrawn: Position[];
  };
  summary: {
    total_active_positions: number;
    total_invested: number;
    total_current_profit: number;
    total_matured_positions: number;
    total_lifetime_earnings: number;
  };
}

export function PortfolioContent() {
  const router = useRouter();
  const [data, setData] = useState<PositionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [liveProfits, setLiveProfits] = useState<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPositions();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/earn/positions');
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch positions');
      }

      setData(responseData);

      const initialProfits: Record<string, number> = {};
      responseData.grouped.active.forEach((position: Position) => {
        initialProfits[position.id] = position.calculated.current_profit;
      });
      setLiveProfits(initialProfits);

      startLiveCounters(responseData.grouped.active);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const startLiveCounters = (activePositions: Position[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setLiveProfits((prev) => {
        const updated = { ...prev };

        activePositions.forEach((position) => {
          const profitPerSecond = position.daily_profit_rate / 86400;
          const newProfit = (prev[position.id] || position.calculated.current_profit) + profitPerSecond;
          updated[position.id] = Math.min(newProfit, position.total_profit_usdt);
        });

        return updated;
      });
    }, 1000);
  };

  const handleClaimClick = (position: Position) => {
    setSelectedPosition(position);
    setConfirmDialogOpen(true);
  };

  const handleConfirmClaim = async () => {
    if (!selectedPosition) return;

    setClaiming(selectedPosition.id);
    setConfirmDialogOpen(false);

    try {
      const response = await fetch('/api/earn/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: selectedPosition.id }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Claim failed');
      }

      toast.success(`Successfully claimed ${responseData.payout.total.toFixed(2)} USDT!`);
      await fetchPositions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setClaiming(null);
      setSelectedPosition(null);
    }
  };

  const formatTimeRemaining = (daysRemaining: number, hoursRemaining: number) => {
    if (daysRemaining > 0) {
      return `${daysRemaining}d ${hoursRemaining}h`;
    }
    return `${hoursRemaining}h`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-text-tertiary text-center">Loading your portfolio...</p>

        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-bg-tertiary animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-bg-tertiary/60 animate-pulse rounded" />
                    <div className="h-5 w-24 bg-bg-tertiary animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-bg-tertiary animate-pulse rounded" />
                    <div className="h-3 w-24 bg-bg-tertiary/60 animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-16 bg-bg-tertiary animate-pulse rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-brand-primary/30" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-12 bg-bg-tertiary/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasPositions = data.grouped.active.length > 0 || data.grouped.matured.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Active Value</p>
                <p className="text-base md:text-lg font-bold">
                  ${data.summary.total_invested.toFixed(2)}
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
                <p className="text-xs text-text-secondary">Current Profit</p>
                <p className="text-base md:text-lg font-bold text-action-green">
                  +${data.summary.total_current_profit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matured Positions */}
      {data.grouped.matured.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base md:text-lg font-semibold">Ready to Claim</h3>

          {data.grouped.matured.map((position) => (
            <Card key={position.id} className="border-action-green/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base md:text-lg">{position.vault.title}</CardTitle>
                      <CheckCircle className="h-5 w-5 text-action-green" />
                    </div>
                    <CardDescription>Matured and ready to withdraw</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-action-green/10 rounded-lg border border-action-green/30">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Principal</p>
                      <p className="font-semibold">${position.amount_usdt.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Profit Earned</p>
                      <p className="font-semibold text-action-green">
                        +${position.total_profit_usdt.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Total</p>
                      <p className="font-bold text-action-green">
                        ${(position.amount_usdt + position.total_profit_usdt).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-action-green hover:bg-action-green-dark"
                    onClick={() => handleClaimClick(position)}
                    disabled={claiming === position.id}
                  >
                    {claiming === position.id
                      ? 'Processing...'
                      : `Claim ${(position.amount_usdt + position.total_profit_usdt).toFixed(2)} USDT`
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Active Positions */}
      {data.grouped.active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base md:text-lg font-semibold">Active Positions</h3>

          {data.grouped.active.map((position) => (
            <Card key={position.id} className="border-brand-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">{position.vault.title}</CardTitle>
                    <CardDescription>
                      {position.vault.apy_percent}% APY • {position.vault.duration_months} months
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <span className="text-sm text-text-secondary">
                      {formatTimeRemaining(
                        position.calculated.days_remaining,
                        position.calculated.hours_remaining
                      )}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-tertiary">
                    <span>Progress</span>
                    <span>{position.calculated.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all duration-1000"
                      style={{ width: `${Math.min(position.calculated.progress_percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Invested</p>
                    <p className="font-semibold">${position.amount_usdt.toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Profit (Live)</p>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-action-green">
                        +${(liveProfits[position.id] || position.calculated.current_profit).toFixed(2)}
                      </p>
                      <Activity className="h-3 w-3 text-action-green animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-text-tertiary mb-1">At Maturity</p>
                    <p className="font-semibold text-brand-primary">
                      ${(position.amount_usdt + position.total_profit_usdt).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-text-tertiary">
                  Matures on {new Date(position.matures_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Withdrawn Positions */}
      {data.grouped.withdrawn.length > 0 && (
        <div className="space-y-4">
          <button
            className="flex items-center gap-2 text-lg font-semibold hover:text-brand-primary transition-colors"
            onClick={() => setShowWithdrawn(!showWithdrawn)}
          >
            {showWithdrawn ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span>History ({data.grouped.withdrawn.length})</span>
          </button>

          {showWithdrawn && data.grouped.withdrawn.map((position) => (
            <Card key={position.id} className="opacity-60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">{position.vault.title}</CardTitle>
                    <CardDescription>
                      Withdrawn on {new Date(position.withdrawn_at!).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">Profit Earned</p>
                    <p className="font-semibold text-action-green">
                      +${position.total_profit_usdt.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasPositions && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-text-tertiary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No Active Positions</h3>
              <p className="text-text-secondary">
                Start earning by investing in a vault
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {selectedPosition && (
        <ConfirmActionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleConfirmClaim}
          title="Claim Investment"
          description={`You are about to claim your matured investment in ${selectedPosition.vault.title}. Funds will be transferred to your wallet.`}
          details={[
            { label: "Vault", value: selectedPosition.vault.title },
            { label: "Principal", value: `$${selectedPosition.amount_usdt.toFixed(2)} USDT` },
            { label: "Profit", value: `$${selectedPosition.total_profit_usdt.toFixed(2)} USDT`, highlight: true },
            { label: "Total Payout", value: `$${(selectedPosition.amount_usdt + selectedPosition.total_profit_usdt).toFixed(2)} USDT`, highlight: true },
            { label: "Investment Duration", value: `${selectedPosition.vault.duration_months} ${selectedPosition.vault.duration_months === 1 ? 'month' : 'months'}` },
          ]}
          confirmText="Claim Funds"
          loading={claiming === selectedPosition.id}
        />
      )}
    </div>
  );
}

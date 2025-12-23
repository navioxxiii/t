/**
 * Trader Detail Page
 * Shows trader details and allocation form
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TrendingUp, Users, DollarSign, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useBalances } from '@/hooks/useBalances';
import { useStartCopyTrade } from '@/hooks/useCopyTrade';

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

export default function TraderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traderId = params.id as string;

  const [trader, setTrader] = useState<Trader | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');

  // Fetch user balances
  const { data: balances } = useBalances();

  // Copy trade mutation hook
  const startCopyMutation = useStartCopyTrade();

  // Get USDT available balance (excluding locked funds)
  const userBalance = useMemo(() => {
    const usdtBalance = balances?.find(b => b.token.code === 'usdt');
    return parseFloat(usdtBalance?.available_balance ?? '0');
  }, [balances]);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [leavingWaitlist, setLeavingWaitlist] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrader();
    // fetchUserBalance removed - now using useBalances hook
    checkWaitlistStatus();
  }, [traderId]);

  const fetchTrader = async () => {
    try {
      const response = await fetch('/api/copy-trade/traders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch traders');
      }

      const foundTrader = data.traders.find((t: Trader) => t.id === traderId);
      if (!foundTrader) {
        throw new Error('Trader not found');
      }

      setTrader(foundTrader);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load trader');
      router.push('/copy-trade');
    } finally {
      setLoading(false);
    }
  };

  const checkWaitlistStatus = async () => {
    try {
      const response = await fetch('/api/copy-trade/waitlist/status');
      const data = await response.json();

      if (response.ok && data.waitlist_entries) {
        const isWaitlisted = data.waitlist_entries.some(
          (entry: { trader_id: string }) => entry.trader_id === traderId
        );
        setIsOnWaitlist(isWaitlisted);
      }
    } catch (err) {
      console.error('Failed to check waitlist status:', err);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trader) return;

    const allocationAmount = parseFloat(amount);

    // Validations
    if (isNaN(allocationAmount) || allocationAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (allocationAmount > userBalance) {
      toast.error('Insufficient USDT balance');
      return;
    }

    // Optional: Add minimum allocation check if needed
    // if (allocationAmount < MIN_ALLOCATION) {
    //   toast.error(`Minimum allocation is ${MIN_ALLOCATION} USDT`);
    //   return;
    // }

    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmStartCopying = async () => {
    if (!trader) return;

    const allocationAmount = parseFloat(amount);
    setConfirmDialogOpen(false);

    try {
      await startCopyMutation.mutateAsync({
        traderId: trader.id,
        amount: allocationAmount,
      });

      // Success! Toast is handled by the hook
      // Navigate to copy-trade page
      router.push('/copy-trade');
    } catch (error) {
      // Error toast is handled by the hook
      // Just log for debugging
      console.error('Failed to start copying:', error);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!trader) return;

    setJoiningWaitlist(true);

    try {
      const response = await fetch('/api/copy-trade/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId: trader.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      toast.success(data.message);
      setIsOnWaitlist(true); // Update local state
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!trader) return;

    setLeavingWaitlist(true);

    try {
      const response = await fetch('/api/copy-trade/waitlist/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId: trader.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave waitlist');
      }

      toast.success('Left waitlist successfully');
      setIsOnWaitlist(false); // Update local state
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave waitlist');
    } finally {
      setLeavingWaitlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-16 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-bg-tertiary rounded" />
            <div className="h-64 bg-bg-tertiary rounded-lg" />
            <div className="h-48 bg-bg-tertiary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!trader) {
    return null;
  }

  const monthlyRoi = trader.stats?.monthly_roi ||
    ((trader.historical_roi_min + trader.historical_roi_max) / 2);
  const isPositive = monthlyRoi >= 0;
  const isFull = trader.availability.isFull;

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

  return (
    <div className="min-h-screen p-4 pt-16 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Trader Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-bg-tertiary flex-shrink-0">
                <Image
                  src={trader.avatar_url || '/placeholder-avatar.png'}
                  alt={trader.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{trader.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{trader.strategy}</Badge>
                  <Badge variant="outline" className={getRiskColor(trader.risk_level)}>
                    {trader.risk_level.toUpperCase()} RISK
                  </Badge>
                  {isFull && (
                    <Badge variant="outline" className="bg-action-red/10 text-action-red border-action-red/30">
                      FULL
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-text-secondary">{trader.bio}</p>

            {/* Monthly ROI Highlight */}
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Monthly ROI</span>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="h-5 w-5 text-action-green" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-action-red rotate-180" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
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
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <DollarSign className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Assets Under Management</p>
                  <p className="font-bold">
                    ${(trader.aum_usdt / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <Users className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Copiers</p>
                  <p className="font-bold">
                    {trader.current_copiers} / {trader.max_copiers}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <Zap className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Performance Fee</p>
                  <p className="font-bold">{trader.performance_fee_percent}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <AlertTriangle className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Max Drawdown</p>
                  <p className="font-bold text-action-red">
                    -{(trader.max_drawdown * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            {trader.stats && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-bg-tertiary">
                {trader.stats.win_rate !== undefined && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Win Rate</p>
                    <p className="font-semibold">{trader.stats.win_rate}%</p>
                  </div>
                )}
                {trader.stats.avg_hold_time_hours !== undefined && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Avg Hold Time</p>
                    <p className="font-semibold">{trader.stats.avg_hold_time_hours.toFixed(1)}h</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Form or Waitlist */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isFull ? (isOnWaitlist ? 'Waitlist Status' : 'Join Waitlist') : 'Start Copying'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isFull ? (
              isOnWaitlist ? (
                // User is already on the waitlist
                <div className="space-y-4">
                  <div className="p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
                    <p className="font-semibold text-brand-primary flex items-center gap-2">
                      <span>✓</span>
                      <span>You&apos;re on the waitlist</span>
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      We&apos;ll notify you when a spot becomes available for {trader.name}
                    </p>
                  </div>
                  <Button
                    onClick={handleLeaveWaitlist}
                    disabled={leavingWaitlist}
                    variant="outline"
                    className="w-full"
                  >
                    {leavingWaitlist ? 'Leaving...' : 'Leave Waitlist'}
                  </Button>
                </div>
              ) : (
                // User can join the waitlist
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    This trader is currently at full capacity. Join the waitlist to be notified
                    when a spot becomes available.
                  </p>
                  <Button
                    onClick={handleJoinWaitlist}
                    disabled={joiningWaitlist}
                    className="w-full"
                  >
                    {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </div>
              )
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Balance Display */}
                <div className="flex justify-between text-sm p-3 bg-bg-tertiary rounded-lg">
                  <span className="text-text-secondary">Available Balance</span>
                  <span className="font-semibold">{userBalance.toFixed(2)} USDT</span>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Allocation Amount (USDT)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={parseFloat(amount) > userBalance ? 'border-action-red' : ''}
                      required
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary text-sm font-semibold hover:underline"
                      onClick={() => setAmount(userBalance.toString())}
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                  {parseFloat(amount) > userBalance && (
                    <p className="text-xs text-action-red">Insufficient balance</p>
                  )}
                  <p className="text-xs text-text-tertiary">
                    Performance fee of {trader.performance_fee_percent}% will be charged on profits
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-bg-tertiary rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Your Allocation</span>
                    <span className="font-semibold">${amount || '0.00'} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Performance Fee</span>
                    <span className="font-semibold">{trader.performance_fee_percent}% on profits</span>
                  </div>
                  {amount && parseFloat(amount) > 0 && (
                    <div className="flex justify-between pt-2 border-t border-bg-primary">
                      <span className="text-text-tertiary">Remaining Balance</span>
                      <span className="font-semibold">
                        ${(userBalance - parseFloat(amount)).toFixed(2)} USDT
                      </span>
                    </div>
                  )}
                </div>

                {/* Risk Warning */}
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Risk Warning</p>
                        <p className="text-xs text-text-secondary">
                          Copy trading involves risk. Your portfolio value will fluctuate and may go down as well as up.
                          Past performance does not guarantee future results. Only invest what you can afford to lose.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={startCopyMutation.isPending || !amount || parseFloat(amount) > userBalance || parseFloat(amount) <= 0}
                  className="w-full"
                >
                  {startCopyMutation.isPending ? 'Processing...' : `Copy ${trader.name}`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <Card className="border-bg-tertiary/50">
          <CardContent className="p-4 text-xs text-text-tertiary">
            <p>
              <strong>Risk Warning:</strong> Copy trading involves significant risk of loss.
              Past performance is not indicative of future results. Only invest what you can afford to lose.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmStartCopying}
        title="Confirm Copy Trading"
        description={`You are about to start copying ${trader.name}'s trading strategy. Please review the details below.`}
        details={[
          { label: 'Allocation', value: `$${amount || '0'} USDT`, highlight: true },
          { label: 'Trader', value: trader.name },
          { label: 'Strategy', value: trader.strategy },
          { label: 'Risk Level', value: trader.risk_level.toUpperCase() },
          { label: 'Performance Fee', value: `${trader.performance_fee_percent}% on profits` },
          {
            label: 'Max Drawdown',
            value: <span className="text-action-red">-{(trader.max_drawdown * 100).toFixed(1)}%</span>
          },
        ]}
        confirmText="Start Copying"
        loading={startCopyMutation.isPending}
      />
    </div>
  );
}

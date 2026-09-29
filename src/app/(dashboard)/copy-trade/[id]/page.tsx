/**
 * Trader Detail Page
 * Shows trader details and allocation form
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Zap,
  ArrowLeft,
  ArrowRight,
  Activity,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TraderAvatar } from '@/components/copy-trade/TraderAvatar';
import { DemoBanner } from '@/components/copy-trade/DemoBanner';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useBalances } from '@/hooks/useBalances';
import {
  useJoinWaitlist,
  useLeaveWaitlist,
  useStartCopyTrade,
  useTrader,
} from '@/hooks/useCopyTrade';
import { cn } from '@/lib/utils';
import { formatChange, formatUSD, parseAmountInput } from '@/lib/utils/currency';
import { getMonthlyRoi, getRiskColor } from '@/lib/copy-trade/format';
import { MIN_COPY_ALLOCATION_USDT } from '@/types/copy-trade';

const QUICK_PERCENTAGES = [25, 50, 75, 100];

export default function TraderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traderId = params.id as string;

  const [amount, setAmount] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: trader, isPending, isSuccess, isError, error } = useTrader(traderId);
  const { data: balances } = useBalances();
  const startCopyMutation = useStartCopyTrade();
  const joinWaitlistMutation = useJoinWaitlist();
  const leaveWaitlistMutation = useLeaveWaitlist();

  // USDT available balance (excluding locked funds)
  const usdtBalance = balances?.find((b) => b.token.code === 'usdt');
  const userBalance = parseFloat(usdtBalance?.available_balance ?? '0');

  // Trader list loaded but this id isn't in it (or the list failed)
  useEffect(() => {
    if ((isSuccess && !trader) || isError) {
      toast.error(isError ? error.message : 'Trader not found');
      router.push('/copy-trade?tab=traders');
    }
  }, [isSuccess, isError, trader, error, router]);

  if (isPending || !trader) {
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

  const monthlyRoi = getMonthlyRoi(trader);
  const isPositive = monthlyRoi >= 0;
  const isFull = trader.availability.isFull;
  const feePercent = trader.performance_fee_percent;

  // Allocation validation
  const parsedAmount = parseAmountInput(amount) ?? 0;
  const belowMinimum = parsedAmount > 0 && parsedAmount < MIN_COPY_ALLOCATION_USDT;
  const overBalance = parsedAmount > userBalance;
  const canSubmit = parsedAmount >= MIN_COPY_ALLOCATION_USDT && !overBalance;
  const insufficientForMinimum = userBalance < MIN_COPY_ALLOCATION_USDT;

  // Illustrative only - based on last month's ROI, fee charged on profits
  const grossMonthly = parsedAmount * (monthlyRoi / 100);
  const estMonthly = grossMonthly > 0 ? grossMonthly * (1 - feePercent / 100) : grossMonthly;

  const setQuickAmount = (percent: number) => {
    // Round down to cents so we never exceed the available balance
    const value = Math.floor(userBalance * (percent / 100) * 100) / 100;
    setAmount(value.toFixed(2));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) setConfirmDialogOpen(true);
  };

  const handleConfirmStartCopying = async () => {
    setConfirmDialogOpen(false);
    try {
      await startCopyMutation.mutateAsync({ traderId: trader.id, amount: parsedAmount });
      router.push('/copy-trade?tab=portfolio');
    } catch {
      // Error toast is handled by the hook
    }
  };

  const stats = [
    { icon: DollarSign, label: 'Assets Under Management', value: formatUSD(trader.aum_usdt, { compact: true }) },
    { icon: Users, label: 'Copiers', value: `${trader.current_copiers} / ${trader.max_copiers}` },
    { icon: Zap, label: 'Performance Fee', value: `${feePercent}%` },
    {
      icon: AlertTriangle,
      label: 'Max Drawdown',
      value: `-${(trader.max_drawdown * 100).toFixed(1)}%`,
      className: 'text-action-red',
    },
  ];

  const estimateLine = (
    <span className={estMonthly >= 0 ? 'text-action-green' : 'text-action-red'}>
      ≈ {formatChange(estMonthly)} / month
    </span>
  );

  return (
    <div className="min-h-screen p-4 pt-16 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        <DemoBanner />

        <Link
          href="/copy-trade?tab=traders"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All traders
        </Link>

        {/* Trader Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <TraderAvatar name={trader.name} src={trader.avatar_url} className="h-16 w-16" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl mb-1">{trader.name}</CardTitle>
                <p className="text-sm text-text-secondary mb-2">{trader.strategy}</p>
                <div className="flex items-center gap-2 flex-wrap">
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
                    <TrendingDown className="h-5 w-5 text-action-red" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      isPositive ? 'text-action-green' : 'text-action-red'
                    }`}
                  >
                    {formatChange(monthlyRoi, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                  <stat.icon className="h-5 w-5 shrink-0 text-text-tertiary" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                    <p className={cn('font-bold', stat.className)}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            {(trader.stats.win_rate !== undefined ||
              trader.stats.avg_hold_time_hours !== undefined) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-bg-tertiary">
                {trader.stats.win_rate !== undefined && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Win Rate</p>
                    <p className="font-semibold">
                      {/* Stored as a fraction (0.45), like max_drawdown */}
                      {(trader.stats.win_rate <= 1 ? trader.stats.win_rate * 100 : trader.stats.win_rate).toFixed(1)}%
                    </p>
                  </div>
                )}
                {trader.stats.avg_hold_time_hours !== undefined && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Avg Hold Time</p>
                    <p className="font-semibold">{Number(trader.stats.avg_hold_time_hours).toFixed(1)}h</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Card: already copying / waitlist / allocation form */}
        {trader.isUserCopying ? (
          <Card className="border-brand-primary/40">
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-brand-primary/10 p-2">
                  <Activity className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-semibold">You&apos;re copying {trader.name}</p>
                  <p className="text-sm text-text-secondary">
                    Track performance or stop copying from your portfolio.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full group">
                <Link href="/copy-trade?tab=portfolio">
                  Manage Position
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : isFull ? (
          <Card>
            <CardHeader>
              <CardTitle>{trader.isUserOnWaitlist ? 'Waitlist Status' : 'Join Waitlist'}</CardTitle>
            </CardHeader>
            <CardContent>
              {trader.isUserOnWaitlist ? (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
                    <p className="font-semibold text-brand-primary flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      You&apos;re on the waitlist
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      We&apos;ll notify you when a spot becomes available for {trader.name}
                    </p>
                  </div>
                  <Button
                    onClick={() => leaveWaitlistMutation.mutate(trader.id)}
                    disabled={leaveWaitlistMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {leaveWaitlistMutation.isPending ? 'Leaving...' : 'Leave Waitlist'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    This trader is currently at full capacity. Join the waitlist to be notified
                    when a spot becomes available.
                  </p>
                  <Button
                    onClick={() => joinWaitlistMutation.mutate(trader.id)}
                    disabled={joinWaitlistMutation.isPending}
                    className="w-full"
                  >
                    {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Start Copying</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="amount">Allocation (USDT)</Label>
                    <span className="text-xs text-text-secondary">
                      Available: <span className="font-semibold text-text-primary">{formatUSD(userBalance)}</span>
                    </span>
                  </div>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={`Min ${MIN_COPY_ALLOCATION_USDT}.00`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    aria-invalid={overBalance || belowMinimum}
                    className={cn((overBalance || belowMinimum) && 'border-action-red')}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_PERCENTAGES.map((percent) => (
                      <Button
                        key={percent}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={userBalance <= 0}
                        onClick={() => setQuickAmount(percent)}
                      >
                        {percent === 100 ? 'Max' : `${percent}%`}
                      </Button>
                    ))}
                  </div>
                  {overBalance ? (
                    <p className="text-xs text-action-red">Insufficient balance</p>
                  ) : belowMinimum ? (
                    <p className="text-xs text-action-red">
                      Minimum allocation is {MIN_COPY_ALLOCATION_USDT} USDT
                    </p>
                  ) : insufficientForMinimum ? (
                    <p className="text-xs text-text-tertiary">
                      You need at least {MIN_COPY_ALLOCATION_USDT} USDT available to copy a trader.{' '}
                      <Link href="/dashboard" className="text-brand-primary hover:underline">
                        Add funds
                      </Link>
                    </p>
                  ) : null}
                </div>

                {/* Summary */}
                <div className="p-4 bg-bg-tertiary rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Your Allocation</span>
                    <span className="font-semibold">{formatUSD(parsedAmount)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Performance Fee</span>
                    <span className="font-semibold">{feePercent}% on profits</span>
                  </div>
                  {parsedAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Remaining Balance</span>
                      <span className={cn('font-semibold', overBalance && 'text-action-red')}>
                        {formatUSD(userBalance - parsedAmount)} USDT
                      </span>
                    </div>
                  )}
                  {canSubmit && (
                    <div className="pt-2 border-t border-bg-primary space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Est. monthly return</span>
                        <span className="font-semibold">{estimateLine}</span>
                      </div>
                      <p className="text-[11px] text-text-tertiary">
                        Estimate based on last month&apos;s ROI, after the performance fee. Not guaranteed.
                      </p>
                    </div>
                  )}
                </div>

                {/* Risk Warning */}
                <div className="flex gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    Copy trading involves significant risk of loss. Your allocation may go down as
                    well as up, and past performance does not guarantee future results. Only invest
                    what you can afford to lose.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={startCopyMutation.isPending || !canSubmit}
                  className="w-full"
                >
                  {startCopyMutation.isPending ? 'Processing...' : `Copy ${trader.name}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmStartCopying}
        title="Confirm Copy Trading"
        description={`You are about to start copying ${trader.name}'s trading strategy. Please review the details below.`}
        details={[
          { label: 'Allocation', value: `${formatUSD(parsedAmount)} USDT`, highlight: true },
          { label: 'Trader', value: trader.name },
          { label: 'Strategy', value: trader.strategy },
          { label: 'Risk Level', value: trader.risk_level.toUpperCase() },
          { label: 'Performance Fee', value: `${feePercent}% on profits` },
          {
            label: 'Max Drawdown',
            value: <span className="text-action-red">-{(trader.max_drawdown * 100).toFixed(1)}%</span>,
          },
          { label: 'Est. Monthly Return (not guaranteed)', value: estimateLine },
        ]}
        confirmText="Start Copying"
        loading={startCopyMutation.isPending}
      />
    </div>
  );
}

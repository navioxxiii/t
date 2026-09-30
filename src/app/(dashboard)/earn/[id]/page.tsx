/**
 * Vault Detail Page
 * Vault terms, live earnings projection and the invest form
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CalendarCheck, Clock, Lock, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useBalances } from '@/hooks/useBalances';
import { useEarnInvest, useEarnVault } from '@/hooks/useEarn';
import { cn } from '@/lib/utils';
import { formatChange, formatUSD, parseAmountInput } from '@/lib/utils/currency';
import { addMonths, calcTotalProfit } from '@/lib/earn/calc';
import { formatDate, formatDuration, getRiskColor } from '@/lib/earn/format';

const QUICK_PERCENTAGES = [25, 50, 75, 100];

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;

  const [amount, setAmount] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: vault, isPending, isError, error, refetch } = useEarnVault(vaultId);
  const { data: balances } = useBalances();
  const investMutation = useEarnInvest();

  // USDT available balance (excluding locked funds)
  const usdtBalance = balances?.find((b) => b.token.code === 'usdt');
  const userBalance = parseFloat(usdtBalance?.available_balance ?? '0');

  if (isPending) {
    return (
      <div className="min-h-screen p-4 pt-6 pb-24">
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !vault) {
    return (
      <div className="min-h-screen p-4 pt-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <p className="font-semibold">{isError ? error.message : 'Vault not found'}</p>
              <p className="text-sm text-text-secondary">
                {isError ? 'Something went wrong loading this vault.' : 'This vault may have closed or sold out.'}
              </p>
              <div className="flex justify-center gap-2">
                {isError && (
                  <Button variant="outline" onClick={() => refetch()}>
                    Try again
                  </Button>
                )}
                <Button asChild>
                  <Link href="/earn?tab=vaults">Browse vaults</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isFull = vault.availability.isFull;
  const remainingCapacity = vault.availability.remainingCapacity;

  // Largest amount that passes every server-side limit
  const maxInvestable = Math.min(
    userBalance,
    vault.max_amount ?? Infinity,
    remainingCapacity ?? Infinity
  );

  // Validation - mirrors /api/earn/invest
  const parsedAmount = parseAmountInput(amount) ?? 0;
  const validationError =
    parsedAmount <= 0
      ? null
      : parsedAmount > userBalance
      ? 'Insufficient balance'
      : parsedAmount < vault.min_amount
      ? `Minimum investment is ${formatUSD(vault.min_amount)}`
      : vault.max_amount !== null && parsedAmount > vault.max_amount
      ? `Maximum investment is ${formatUSD(vault.max_amount)}`
      : remainingCapacity !== null && parsedAmount > remainingCapacity
      ? `Only ${formatUSD(remainingCapacity)} of capacity left`
      : null;
  const canSubmit = parsedAmount > 0 && !validationError && !isFull;
  const insufficientForMinimum = userBalance < vault.min_amount;

  const projectedProfit = calcTotalProfit(parsedAmount, vault.apy_percent, vault.duration_months);
  const maturityDate = addMonths(new Date(), vault.duration_months);

  const setQuickAmount = (percent: number) => {
    // Round down to cents so we never exceed a limit
    const value = Math.floor(maxInvestable * (percent / 100) * 100) / 100;
    setAmount(value.toFixed(2));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) setConfirmDialogOpen(true);
  };

  const handleConfirmInvest = async () => {
    setConfirmDialogOpen(false);
    try {
      await investMutation.mutateAsync({ vaultId: vault.id, amount: parsedAmount });
      router.push('/earn?tab=portfolio');
    } catch {
      // Error toast is handled by the hook
    }
  };

  const terms = [
    { icon: Clock, label: 'Lock period', value: formatDuration(vault.duration_months, true) },
    { icon: Lock, label: 'Minimum', value: formatUSD(vault.min_amount) },
    { icon: TrendingUp, label: 'Maximum', value: vault.max_amount ? formatUSD(vault.max_amount) : 'No limit' },
    { icon: CalendarCheck, label: 'Unlocks on', value: formatDate(maturityDate) },
  ];

  return (
    <div className="min-h-screen p-4 pt-6 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/earn?tab=vaults"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All vaults
        </Link>

        {/* Vault Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xl md:text-2xl mb-1">{vault.title}</CardTitle>
                {vault.subtitle && <p className="text-sm text-text-secondary">{vault.subtitle}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className={getRiskColor(vault.risk_level)}>
                  {vault.risk_level.toUpperCase()} RISK
                </Badge>
                {isFull && (
                  <Badge variant="outline" className="bg-action-red/10 text-action-red border-action-red/30">
                    FULL
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-brand-primary/10 border border-brand-primary/30 p-4">
              <span className="text-sm text-text-secondary">Fixed APY</span>
              <span className="text-3xl md:text-4xl font-bold text-brand-primary">{vault.apy_percent}%</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {terms.map((term) => (
                <div key={term.label} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                  <term.icon className="hidden sm:block h-5 w-5 shrink-0 text-text-tertiary" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-tertiary">{term.label}</p>
                    <p className="font-bold text-sm md:text-base truncate">{term.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {vault.total_capacity !== null && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Vault capacity</span>
                  <span className="font-semibold">
                    {isFull
                      ? 'Full'
                      : `${formatUSD(remainingCapacity ?? 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} left`}
                  </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', isFull ? 'bg-action-red' : 'bg-brand-primary')}
                    style={{ width: `${Math.min(vault.availability.fillPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invest Form */}
        {isFull ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-semibold">This vault is at full capacity</p>
              <p className="text-sm text-text-secondary">Check out the other vaults for open spots.</p>
              <Button asChild variant="outline">
                <Link href="/earn?tab=vaults">Browse vaults</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Invest</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="amount">Amount (USDT)</Label>
                    <span className="text-xs text-text-secondary">
                      Available: <span className="font-semibold text-text-primary">{formatUSD(userBalance)}</span>
                    </span>
                  </div>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={`Min ${vault.min_amount}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    aria-invalid={Boolean(validationError)}
                    className={cn('text-lg', validationError && 'border-action-red')}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_PERCENTAGES.map((percent) => (
                      <Button
                        key={percent}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={maxInvestable <= 0}
                        onClick={() => setQuickAmount(percent)}
                      >
                        {percent === 100 ? 'Max' : `${percent}%`}
                      </Button>
                    ))}
                  </div>
                  {validationError ? (
                    <p className="text-xs text-action-red">{validationError}</p>
                  ) : insufficientForMinimum ? (
                    <p className="text-xs text-text-tertiary">
                      You need at least {formatUSD(vault.min_amount)} USDT available for this vault.{' '}
                      <Link href="/dashboard" className="text-brand-primary hover:underline">
                        Add funds
                      </Link>
                    </p>
                  ) : null}
                </div>

                {/* Projection */}
                <div className="p-4 bg-bg-tertiary rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">You invest</span>
                    <span className="font-semibold">{formatUSD(parsedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Profit at maturity</span>
                    <span className="font-semibold text-action-green">{formatChange(projectedProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Unlocks on</span>
                    <span className="font-semibold">{formatDate(maturityDate)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-bg-primary">
                    <span className="font-semibold">Total payout</span>
                    <span className="font-bold text-brand-primary">
                      {formatUSD(parsedAmount + projectedProfit)}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-3 rounded-lg border border-bg-tertiary p-3">
                  <div className="flex gap-3">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5 text-brand-primary" />
                    <p className="text-xs text-text-secondary">
                      The {vault.apy_percent}% APY is fixed for the full {formatDuration(vault.duration_months, true)}.
                      Profit accrues daily and is paid with your principal at maturity.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                    <p className="text-xs text-text-secondary">
                      Funds can&apos;t be withdrawn before the maturity date. Only lock what you won&apos;t
                      need during this period.
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={!canSubmit || investMutation.isPending}>
                  {investMutation.isPending ? 'Processing...' : 'Review Investment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmInvest}
        title="Confirm Investment"
        description={`Your funds will be locked in ${vault.title} until ${formatDate(maturityDate)}.`}
        details={[
          { label: 'Amount', value: `${formatUSD(parsedAmount)} USDT`, highlight: true },
          { label: 'APY', value: `${vault.apy_percent}%` },
          { label: 'Lock Period', value: formatDuration(vault.duration_months, true) },
          { label: 'Maturity Date', value: formatDate(maturityDate) },
          { label: 'Projected Profit', value: `${formatChange(projectedProfit)} USDT`, highlight: true },
          { label: 'Total at Maturity', value: `${formatUSD(parsedAmount + projectedProfit)} USDT` },
        ]}
        confirmText="Confirm Investment"
        loading={investMutation.isPending}
      />
    </div>
  );
}

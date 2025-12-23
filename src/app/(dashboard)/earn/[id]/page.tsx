'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Clock, Lock, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useBalances } from '@/hooks/useBalances';
import { useEarnInvest } from '@/hooks/useEarnInvest';

interface Vault {
  id: string;
  title: string;
  subtitle: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
  total_capacity: number | null;
  risk_level: 'low' | 'medium' | 'high';
  availability: {
    isFull: boolean;
    fillPercentage: number;
    remainingCapacity: number | null;
  };
}

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState('');

  // Fetch user balances
  const { data: balances } = useBalances();

  // Invest mutation hook
  const investMutation = useEarnInvest();

  // Get USDT available balance (excluding locked funds)
  const userBalance = useMemo(() => {
    const usdtBalance = balances?.find(b => b.token.code === 'usdt');
    return parseFloat(usdtBalance?.available_balance ?? '0');
  }, [balances]);

  useEffect(() => {
    params.then((resolvedParams) => {
      fetchVaultDetails(resolvedParams.id);
      // fetchUserBalance removed - now using useBalances hook
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVaultDetails = async (id: string) => {
    try {
      const response = await fetch('/api/earn/vaults');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vault');
      }

      const foundVault = data.vaults?.find((v: Vault) => v.id === id);
      if (!foundVault) {
        throw new Error('Vault not found');
      }

      setVault(foundVault);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load vault');
      router.push('/earn');
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectedProfit = (amount: number) => {
    if (!vault || !amount) return 0;
    return amount * (vault.apy_percent / 100) * (vault.duration_months / 12);
  };

  const handleInvestClick = () => {
    if (!vault || !investAmount) return;

    const amount = parseFloat(investAmount);

    // Validations
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < vault.min_amount) {
      toast.error(`Minimum investment is ${vault.min_amount} USDT`);
      return;
    }

    if (vault.max_amount && amount > vault.max_amount) {
      toast.error(`Maximum investment is ${vault.max_amount} USDT`);
      return;
    }

    if (amount > userBalance) {
      toast.error('Insufficient USDT balance');
      return;
    }

    // Show confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmInvest = async () => {
    if (!vault || !investAmount) return;

    const amount = parseFloat(investAmount);
    setConfirmDialogOpen(false);

    try {
      await investMutation.mutateAsync({
        vaultId: vault.id,
        amount,
      });

      // Success! Toast is handled by the hook
      setInvestDialogOpen(false);
      setInvestAmount('');

      // Redirect to earn page (portfolio tab can be accessed there)
      setTimeout(() => {
        router.push('/earn');
      }, 1000);

    } catch (err) {
      // Error toast is handled by the hook
      // Just log for debugging
      console.error('Investment failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-20">
        <div className="mx-auto max-w-2xl">
          <div className="h-96 bg-bg-secondary animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!vault) {
    return null;
  }

  const projectedProfit = calculateProjectedProfit(parseFloat(investAmount) || 0);
  const projectedTotal = (parseFloat(investAmount) || 0) + projectedProfit;

  return (
    <div className="min-h-screen p-4 pt-16 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Vault Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{vault.title}</CardTitle>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full uppercase font-semibold',
                    vault.risk_level === 'low' && 'bg-action-green/10 text-action-green',
                    vault.risk_level === 'medium' && 'bg-brand-primary/10 text-brand-primary',
                    vault.risk_level === 'high' && 'bg-action-red/10 text-action-red'
                  )}>
                    {vault.risk_level}
                  </span>
                </div>
                <CardDescription className="text-base">{vault.subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* APY Display */}
            <div className="text-center p-6 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                <span className="text-sm text-text-secondary">Fixed APY</span>
              </div>
              <div className="text-5xl font-bold text-brand-primary">
                {vault.apy_percent}%
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">Lock Period</span>
                </div>
                <p className="text-xl font-bold">
                  {vault.duration_months} {vault.duration_months === 1 ? 'Month' : 'Months'}
                </p>
              </div>

              <div className="p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">Min Investment</span>
                </div>
                <p className="text-xl font-bold">${vault.min_amount}</p>
              </div>
            </div>

            {/* Capacity Bar */}
            {vault.total_capacity && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Vault Capacity</span>
                  <span className="font-semibold">
                    {vault.availability.fillPercentage.toFixed(1)}% filled
                  </span>
                </div>
                <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      vault.availability.isFull ? 'bg-action-red' : 'bg-brand-primary'
                    )}
                    style={{ width: `${Math.min(vault.availability.fillPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Investment Info */}
            <Card className="border-bg-tertiary/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-brand-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Fixed Returns</h4>
                    <p className="text-sm text-text-secondary">
                      Your funds are locked for {vault.duration_months} {vault.duration_months === 1 ? 'month' : 'months'} with a guaranteed {vault.apy_percent}% APY. Principal and interest are returned at maturity.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-text-tertiary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Important</h4>
                    <p className="text-sm text-text-secondary">
                      Funds cannot be withdrawn before the maturity date. Make sure you won&apos;t need this capital during the lock period.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              className="w-full"
              size="lg"
              disabled={vault.availability.isFull}
              onClick={() => setInvestDialogOpen(true)}
            >
              {vault.availability.isFull ? 'Capacity Full' : 'Invest Now'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Investment Dialog - Responsive */}
      <ResponsiveDialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Invest in {vault.title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Lock your USDT and earn {vault.apy_percent}% APY for {vault.duration_months} {vault.duration_months === 1 ? 'month' : 'months'}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 p-4 w-full max-w-md mx-auto">
            {/* Balance Display */}
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Available Balance</span>
              <span className="font-semibold">{userBalance.toFixed(2)} USDT</span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Investment Amount (USDT)</label>
              <div className="relative">
                <Input
                  type="number"
                  className={cn(
                    "text-lg pr-16",
                    parseFloat(investAmount) > userBalance && "border-action-red"
                  )}
                  placeholder={`Min: ${vault.min_amount}`}
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  min={vault.min_amount}
                  max={vault.max_amount || userBalance}
                  step="0.01"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary text-sm font-semibold hover:underline"
                  onClick={() => setInvestAmount(userBalance.toString())}
                  type="button"
                >
                  MAX
                </button>
              </div>
              {parseFloat(investAmount) > userBalance && (
                <p className="text-xs text-action-red">Insufficient balance</p>
              )}
              {parseFloat(investAmount) < vault.min_amount && parseFloat(investAmount) > 0 && (
                <p className="text-xs text-action-red">Below minimum amount of ${vault.min_amount}</p>
              )}
              {vault.max_amount && parseFloat(investAmount) > vault.max_amount && (
                <p className="text-xs text-action-red">Exceeds maximum amount of ${vault.max_amount}</p>
              )}
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>Min: ${vault.min_amount}</span>
                {vault.max_amount && <span>Max: ${vault.max_amount}</span>}
              </div>
            </div>

            {/* Projection */}
            {investAmount && parseFloat(investAmount) > 0 && (
              <div className="p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Invested</span>
                  <span className="font-semibold">{parseFloat(investAmount).toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Projected Profit</span>
                  <span className="font-semibold text-action-green">
                    +{projectedProfit.toFixed(2)} USDT
                  </span>
                </div>
                <div className="h-px bg-brand-primary/20 my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold">Total at Maturity</span>
                  <span className="font-bold text-brand-primary">
                    {projectedTotal.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvestDialogOpen(false)}
              disabled={investMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvestClick}
              disabled={
                investMutation.isPending ||
                !investAmount ||
                parseFloat(investAmount) <= 0 ||
                parseFloat(investAmount) > userBalance ||
                parseFloat(investAmount) < vault.min_amount ||
                Boolean(vault.max_amount && parseFloat(investAmount) > vault.max_amount)
              }
            >
              {investMutation.isPending ? 'Processing...' : 'Continue'}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Confirmation Dialog */}
      {vault && (
        <ConfirmActionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleConfirmInvest}
          title="Confirm Investment"
          description={`You are about to invest in ${vault.title}. Your funds will be locked for the duration of the investment period.`}
          details={[
            { label: "Amount", value: `$${investAmount || '0'} USDT`, highlight: true },
            { label: "Vault", value: vault.title },
            { label: "APY", value: `${vault.apy_percent}%` },
            { label: "Duration", value: `${vault.duration_months} ${vault.duration_months === 1 ? 'month' : 'months'}` },
            {
              label: "Maturity Date",
              value: new Date(Date.now() + vault.duration_months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
            },
            { label: "Projected Profit", value: `$${projectedProfit.toFixed(2)} USDT`, highlight: true },
            { label: "Total at Maturity", value: `$${projectedTotal.toFixed(2)} USDT` },
          ]}
          confirmText="Confirm Investment"
          loading={investMutation.isPending}
        />
      )}
    </div>
  );
}

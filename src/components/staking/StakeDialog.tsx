/**
 * StakeDialog - amount entry, honest terms, and confirmation for staking a coin
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { useStake } from '@/hooks/useStaking';
import { branding } from '@/config/branding';
import { cn } from '@/lib/utils';
import { formatCrypto, formatUSD, parseAmountInput } from '@/lib/utils/currency';
import type { StakingAsset } from '@/types/staking';

interface StakeDialogProps {
  asset: StakingAsset | null;
  available: number;
  price?: number;
  onClose: () => void;
}

export function StakeDialog({ asset, available, price, onClose }: StakeDialogProps) {
  const [amount, setAmount] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const stake = useStake();

  if (!asset) return null;
  const symbol = asset.token.symbol;
  const parsed = parseAmountInput(amount) ?? 0;
  const error =
    parsed <= 0
      ? null
      : parsed > available
        ? 'Insufficient balance'
        : parsed < asset.min_stake
          ? `Minimum stake is ${formatCrypto(asset.min_stake, symbol)} ${symbol}`
          : null;
  const canContinue = parsed > 0 && !error;

  const close = () => {
    setAmount('');
    setReviewing(false);
    onClose();
  };

  const confirm = async () => {
    try {
      await stake.mutateAsync({ baseTokenId: asset.base_token_id, amount: parsed });
      close();
    } catch {
      // toast handled by the hook
    }
  };

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && close()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Image src={asset.token.logo_url || '/icons/crypto/default.svg'} alt={symbol} width={24} height={24} className="rounded-full" />
            {reviewing ? `Confirm ${symbol} stake` : `Stake ${symbol}`}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {asset.apy != null
              ? `${asset.apy_is_estimate ? 'Estimated' : 'Recent'} APY ${asset.apy.toFixed(2)}%. Rewards vary and are paid in ${symbol}.`
              : `Rewards vary and are paid in ${symbol}.`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 p-4">
          {!reviewing ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="stake-amount">Amount ({symbol})</Label>
                <span className="text-xs text-text-secondary">
                  Available: <span className="font-semibold text-text-primary">{formatCrypto(available, symbol)}</span>
                </span>
              </div>
              <div className="relative">
                <Input
                  id="stake-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={`Min ${formatCrypto(asset.min_stake, symbol)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={Boolean(error)}
                  className={cn('pr-16 text-lg', error && 'border-action-red')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-brand-primary hover:underline"
                  onClick={() => setAmount(String(Math.floor(available * 1e8) / 1e8))}
                >
                  MAX
                </button>
              </div>
              {error ? (
                <p className="text-xs text-action-red">{error}</p>
              ) : price && parsed > 0 ? (
                <p className="text-xs text-text-tertiary">≈ {formatUSD(parsed * price)}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 rounded-lg bg-bg-tertiary p-4 text-sm">
              <div className="flex justify-between"><span className="text-text-tertiary">You stake</span><span className="font-semibold">{formatCrypto(parsed, symbol)} {symbol}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Platform commission</span><span>{asset.commission_percent}% of rewards</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Unstaking wait</span><span>{asset.unbonding_days > 0 ? `${asset.unbonding_days} days` : 'None'}</span></div>
            </div>
          )}

          <div className="flex gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
            <p className="text-xs text-text-secondary">
              Your {symbol} is pooled and staked by {branding.name.short} on the {asset.token.name} network. Rewards are variable, paid in {symbol},
              and start from your first full day of staking. {asset.unbonding_days > 0 && `Unstaking takes ${asset.unbonding_days} days, during which no rewards are earned. `}
              The value of {symbol} can go down as well as up.
            </p>
          </div>
        </div>

        <ResponsiveDialogFooter>
          {reviewing ? (
            <>
              <Button variant="outline" onClick={() => setReviewing(false)} disabled={stake.isPending}>Back</Button>
              <Button onClick={confirm} disabled={stake.isPending}>
                {stake.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm stake
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button onClick={() => setReviewing(true)} disabled={!canContinue}>Review</Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

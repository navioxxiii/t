/**
 * StakingPositionCard - one stake: amount, rewards so far, and its unstaking state
 */

'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCrypto, formatUSD } from '@/lib/utils/currency';
import type { StakingPosition } from '@/types/staking';

interface StakingPositionCardProps {
  position: StakingPosition;
  price?: number;
  onUnstake?: (position: StakingPosition) => void;
}

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function StakingPositionCard({ position, price, onUnstake }: StakingPositionCardProps) {
  const symbol = position.token.symbol;
  const unbonding = position.status === 'unbonding';
  const withdrawn = position.status === 'withdrawn';

  return (
    <Card className={cn('gap-3 p-4', withdrawn && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image src={position.token.logo_url || '/icons/crypto/default.svg'} alt={symbol} width={36} height={36} className="rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">
              {formatCrypto(position.amount, symbol)} {symbol}
            </p>
            <p className="text-xs text-text-tertiary">
              Staked {new Date(position.staked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {price ? ` · ≈ ${formatUSD(position.amount * price)}` : ''}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'shrink-0',
            position.status === 'active' && 'text-action-green border-action-green/30',
            unbonding && 'text-yellow-500 border-yellow-500/30'
          )}
        >
          {position.status === 'active' ? 'Earning' : unbonding ? 'Unstaking' : 'Completed'}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg bg-bg-tertiary px-3 py-2 text-sm">
        <span className="text-text-tertiary">Rewards earned</span>
        <span className="font-semibold text-action-green">
          +{formatCrypto(position.rewards_total, symbol)} {symbol}
        </span>
      </div>

      {unbonding && position.available_at && (
        <p className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock className="h-3.5 w-3.5" />
          Returns to your balance in {daysUntil(position.available_at)} day(s), on{' '}
          {new Date(position.available_at).toLocaleDateString()}
        </p>
      )}

      {position.status === 'active' && onUnstake && (
        <Button variant="outline" size="sm" className="self-end" onClick={() => onUnstake(position)}>
          Unstake
        </Button>
      )}
    </Card>
  );
}

/**
 * Transaction Item Component
 * Displays individual transaction in a list (shared component)
 */

'use client';

import { ArrowUpRight, ArrowDownLeft, Layers, Loader2, PiggyBank, TrendingUp, Undo2, Users2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/hooks/useTransactions';
import type { CoinPrice } from '@/lib/prices/prices-client';
import { getTokenIcon } from '@/config/token-icons';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatCrypto, formatUSD } from '@/lib/utils/currency';

// Amounts arrive as raw strings/numbers (e.g. "100.66666666666667") - format like the detail drawer
function formatAmount(value: string | number | null | undefined, symbol: string): string {
  return formatCrypto(Number(value) || 0, symbol);
}

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  /** Current prices by symbol, for the ≈ USD line (omitted when unavailable) */
  prices?: Map<string, CoinPrice>;
}

type StatusDisplay = { label: string; sublabel: string; color: string };

const PENDING: StatusDisplay = { label: 'Confirming', sublabel: '', color: 'bg-yellow-500/10 text-yellow-500' };
const FAILED: StatusDisplay = { label: 'Failed', sublabel: '', color: 'bg-red-500/10 text-red-500' };
const CANCELLED: StatusDisplay = { label: 'Cancelled', sublabel: '', color: 'bg-gray-500/10 text-gray-500' };

/**
 * Map internal status to blockchain-native user-friendly display.
 * Hides internal admin workflow; completed transactions get no badge.
 */
function getStatusDisplay(status: string, type: string): StatusDisplay | null {
  if (status === 'completed') return null;
  if (status === 'failed') return FAILED;
  if (status === 'cancelled') return CANCELLED;
  if (type === 'withdrawal') {
    if (status === 'rejected') return { ...FAILED, sublabel: 'Transaction rejected' };
    if (status === 'admin_approved') return { ...PENDING, sublabel: 'Awaiting confirmations (2/3)' };
    if (status === 'super_admin_approved') return { ...PENDING, sublabel: 'Awaiting confirmations (3/3)' };
    return { ...PENDING, sublabel: 'Broadcasting...' };
  }
  return PENDING;
}

// Per-type presentation: title, badge icon/colour, and whether funds came in or went out
const TYPE_DISPLAY: Record<
  Exclude<Transaction['type'], 'swap'>,
  // 'none': informational, no balance change (e.g. unstake requested)
  { title: string; icon: typeof ArrowUpRight; badge: string; direction: 'in' | 'out' | 'none' }
> = {
  deposit: { title: 'Deposit', icon: ArrowDownLeft, badge: 'bg-green-500', direction: 'in' },
  withdrawal: { title: 'Send', icon: ArrowUpRight, badge: 'bg-blue-500', direction: 'out' },
  earn_invest: { title: 'Earn Investment', icon: PiggyBank, badge: 'bg-purple-500', direction: 'out' },
  earn_claim: { title: 'Earn Claim', icon: TrendingUp, badge: 'bg-green-500', direction: 'in' },
  copy_trade_start: { title: 'Start Copying', icon: Users2, badge: 'bg-blue-500', direction: 'out' },
  copy_trade_stop: { title: 'Stop Copying', icon: Users2, badge: 'bg-green-500', direction: 'in' },
  staking_stake: { title: 'Staked', icon: Layers, badge: 'bg-brand-primary', direction: 'out' },
  staking_unstake: { title: 'Unstake started', icon: Undo2, badge: 'bg-yellow-500', direction: 'none' },
  staking_reward: { title: 'Staking reward', icon: TrendingUp, badge: 'bg-green-500', direction: 'in' },
  staking_release: { title: 'Unstaked', icon: Undo2, badge: 'bg-green-500', direction: 'in' },
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function TokenIcon({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div className={cn('rounded-full bg-white border-2 border-card overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={48}
        height={48}
        className="w-full h-full"
        onError={(e) => {
          if (!e.currentTarget.dataset.fallbackAttempted) {
            e.currentTarget.dataset.fallbackAttempted = 'true';
            e.currentTarget.src = getTokenIcon('default');
          }
        }}
      />
    </div>
  );
}

export function TransactionItem({ transaction, onClick, prices }: TransactionItemProps) {
  const isSwap = transaction.type === 'swap';
  const status = getStatusDisplay(transaction.status, transaction.type);
  const metadata = transaction.metadata;

  // Headline amount: what arrived for swaps, otherwise the transaction amount
  const symbol = isSwap ? transaction.swap_to_coin || '' : transaction.coin_symbol || 'USDT';
  const amount = Number(isSwap ? transaction.swap_to_amount : transaction.amount) || 0;
  const display = transaction.type === 'swap' ? null : TYPE_DISPLAY[transaction.type];
  const BadgeIcon = display?.icon;
  const direction = display?.direction ?? 'in';
  const price = prices?.get(symbol)?.current_price;
  const usdValue = price ? amount * price : null;

  const subtitle = isSwap
    ? `${transaction.swap_from_coin || transaction.coin_symbol} → ${transaction.swap_to_coin || ''}`
    : metadata && 'vault_title' in metadata && metadata.vault_title
      ? metadata.vault_title
      : metadata && 'trader_name' in metadata && metadata.trader_name
        ? metadata.trader_name
        : null;

  const copyProfit =
    transaction.type === 'copy_trade_stop' && metadata && 'user_profit_after_fee' in metadata
      ? Number(metadata.user_profit_after_fee)
      : null;

  return (
    <Card className="p-3 md:p-5 gap-0 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
          {/* Icon: stacked coins for swaps, coin + type badge otherwise */}
          <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12">
            {isSwap ? (
              <>
                <TokenIcon
                  src={transaction.swap_from_token?.logo_url || getTokenIcon(transaction.swap_from_coin || transaction.coin_symbol)}
                  alt={transaction.swap_from_coin || transaction.coin_symbol}
                  className="absolute top-0 left-0 w-6 h-6 md:w-9 md:h-9"
                />
                <TokenIcon
                  src={transaction.swap_to_token?.logo_url || getTokenIcon(transaction.swap_to_coin || '')}
                  alt={transaction.swap_to_coin || ''}
                  className="absolute bottom-0 right-0 w-6 h-6 md:w-9 md:h-9 shadow-sm"
                />
              </>
            ) : (
              <>
                <TokenIcon
                  src={transaction.token?.logo_url || getTokenIcon(transaction.coin_symbol || 'USDT')}
                  alt={transaction.token?.name || transaction.coin_symbol}
                  className="w-8 h-8 md:w-12 md:h-12"
                />
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center',
                    display?.badge
                  )}
                >
                  {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <p className="font-semibold text-sm md:text-base">{display?.title ?? 'Swap'}</p>
              {/* Only unusual states get a badge - completed is the norm */}
              {status && (
                <Badge className={`${status.color} text-xs px-1.5 py-0 flex items-center gap-1`}>
                  {status.label === 'Confirming' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {status.label}
                </Badge>
              )}
            </div>
            {(subtitle || status?.sublabel) && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
                {status?.sublabel || subtitle}
              </p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{formatDate(transaction.created_at)}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={cn(
              'text-base md:text-lg font-semibold whitespace-nowrap',
              direction === 'in' ? 'text-action-green' : direction === 'none' ? 'text-text-secondary' : 'text-text-primary'
            )}
          >
            {direction === 'in' ? '+' : direction === 'out' ? '−' : ''}
            {formatAmount(amount, symbol)} <span className="text-xs md:text-sm font-medium">{symbol}</span>
          </p>
          {usdValue !== null && (
            <p className="text-xs md:text-sm text-muted-foreground">≈ {formatUSD(usdValue)}</p>
          )}

          {isSwap && (
            <p className="text-xs md:text-sm text-muted-foreground/60 mt-0.5 whitespace-nowrap">
              −{formatAmount(transaction.swap_from_amount ?? transaction.amount, transaction.swap_from_coin || transaction.coin_symbol)}{' '}
              {transaction.swap_from_coin || transaction.coin_symbol}
            </p>
          )}
          {transaction.type === 'earn_claim' && metadata && 'profit' in metadata && metadata.profit && (
            <p className="text-xs md:text-sm text-action-green mt-0.5">+{formatAmount(metadata.profit, 'USDT')} profit</p>
          )}
          {copyProfit !== null && copyProfit !== 0 && (
            <p className={cn('text-xs md:text-sm mt-0.5', copyProfit < 0 ? 'text-action-red' : 'text-action-green')}>
              {copyProfit < 0 ? '' : '+'}
              {formatAmount(copyProfit, 'USDT')} {copyProfit < 0 ? 'loss' : 'profit'}
            </p>
          )}
          {transaction.network_fee && parseFloat(transaction.network_fee) > 0 && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Fee: {formatAmount(transaction.network_fee, transaction.coin_symbol)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

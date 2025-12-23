/**
 * Transaction Item Component
 * Displays individual transaction in a list (shared component)
 */

'use client';

import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Loader2, PiggyBank, TrendingUp, Users2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/hooks/useTransactions';
import { getTokenIcon } from '@/config/token-icons';
import Image from 'next/image';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {

  const isDeposit = transaction.type === 'deposit';
  const isSwap = transaction.type === 'swap';
  const isEarnInvest = transaction.type === 'earn_invest';
  const isEarnClaim = transaction.type === 'earn_claim';
  const isCopyTradeStart = transaction.type === 'copy_trade_start';
  const isCopyTradeStop = transaction.type === 'copy_trade_stop';

  /**
   * Map internal status to blockchain-native user-friendly display
   * Hides internal admin workflow and uses decentralized terminology
   */
  const getBlockchainStatus = (status: string, type: string) => {
    if (type === 'withdrawal') {
      const statusMap: Record<string, { label: string; sublabel: string; color: string }> = {
        'pending': {
          label: 'Confirming',
          sublabel: 'Broadcasting...',
          color: 'bg-yellow-500/10 text-yellow-500',
        },
        'admin_approved': {
          label: 'Confirming',
          sublabel: 'Awaiting confirmations (2/3)',
          color: 'bg-yellow-500/10 text-yellow-500',
        },
        'super_admin_approved': {
          label: 'Confirming',
          sublabel: 'Awaiting confirmations (3/3)',
          color: 'bg-yellow-500/10 text-yellow-500',
        },
        'completed': {
          label: 'Confirmed',
          sublabel: '',
          color: 'bg-green-500/10 text-green-500',
        },
        'failed': {
          label: 'Failed',
          sublabel: '',
          color: 'bg-red-500/10 text-red-500',
        },
        'rejected': {
          label: 'Failed',
          sublabel: 'Transaction rejected',
          color: 'bg-red-500/10 text-red-500',
        },
        'cancelled': {
          label: 'Cancelled',
          sublabel: '',
          color: 'bg-gray-500/10 text-gray-500',
        },
      };
      return statusMap[status] || statusMap['pending'];
    }

    // For deposits and swaps, use simpler terminology
    const simpleStatusMap: Record<string, { label: string; sublabel: string; color: string }> = {
      'pending': {
        label: 'Confirming',
        sublabel: '',
        color: 'bg-yellow-500/10 text-yellow-500',
      },
      'completed': {
        label: 'Confirmed',
        sublabel: '',
        color: 'bg-green-500/10 text-green-500',
      },
      'failed': {
        label: 'Failed',
        sublabel: '',
        color: 'bg-red-500/10 text-red-500',
      },
      'cancelled': {
        label: 'Cancelled',
        sublabel: '',
        color: 'bg-gray-500/10 text-gray-500',
      },
    };
    return simpleStatusMap[status] || simpleStatusMap['pending'];
  };

  const blockchainStatus = getBlockchainStatus(transaction.status, transaction.type);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // For swaps, render a different layout
  if (isSwap) {
    return (
      <Card
        className="p-3 md:p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            {/* Stacked Coin Icons for Swaps */}
            <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12">
              {/* From coin (back) */}
              <div className="absolute top-0 left-0 w-6 h-6 md:w-9 md:h-9 rounded-full bg-white border-2 border-card overflow-hidden">
                <Image
                  src={transaction.swap_from_token?.logo_url || getTokenIcon(transaction.swap_from_coin || transaction.coin_symbol)}
                  alt={transaction.swap_from_token?.name || transaction.swap_from_coin || transaction.coin_symbol}
                  width={36}
                  height={36}
                  className="w-full h-full"
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallbackAttempted) {
                      e.currentTarget.dataset.fallbackAttempted = 'true';
                      e.currentTarget.src = getTokenIcon('default');
                    }
                  }}
                />
              </div>
              {/* To coin (front, offset) */}
              <div className="absolute bottom-0 right-0 w-6 h-6 md:w-9 md:h-9 rounded-full bg-white border-2 border-card overflow-hidden shadow-sm">
                <Image
                  src={transaction.swap_to_token?.logo_url || getTokenIcon(transaction.swap_to_coin || '')}
                  alt={transaction.swap_to_token?.name || transaction.swap_to_coin || ''}
                  width={36}
                  height={36}
                  className="w-full h-full"
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallbackAttempted) {
                      e.currentTarget.dataset.fallbackAttempted = 'true';
                      e.currentTarget.src = getTokenIcon('default');
                    }
                  }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                <p className="font-semibold capitalize text-sm md:text-base">Swap</p>
                <Badge className={`${blockchainStatus.color} text-xs md:text-sm px-1.5 md:px-2 py-0 md:py-0.5 flex items-center gap-1`}>
                  {blockchainStatus.label === 'Confirming' && (
                    <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                  )}
                  {blockchainStatus.label}
                </Badge>
              </div>

              {blockchainStatus.sublabel && (
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {blockchainStatus.sublabel}
                </p>
              )}

              <p className="text-xs md:text-sm text-muted-foreground">
                {formatDate(transaction.created_at)}
              </p>
            </div>
          </div>

          {/* Dual Amount Display for Swaps */}
          <div className="text-right shrink-0">
            {/* Received token (emphasized, positive) */}
            <p className="text-base md:text-lg font-semibold text-green-500">
              +{transaction.swap_to_amount ?
                (typeof transaction.swap_to_amount === 'number' ? transaction.swap_to_amount.toFixed(8) : transaction.swap_to_amount)
                : '0.00000000'}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">{transaction.swap_to_coin || 'N/A'}</p>

            {/* Sent token (muted, negative) */}
            <p className="text-xs md:text-sm text-muted-foreground/60 mt-1">
              -{transaction.swap_from_amount ?
                (typeof transaction.swap_from_amount === 'number' ? transaction.swap_from_amount.toFixed(8) : transaction.swap_from_amount)
                : transaction.amount} {transaction.swap_from_coin || transaction.coin_symbol}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // For earn transactions (invest/claim)
  if (isEarnInvest || isEarnClaim) {
    const metadata = transaction.metadata;
    return (
      <Card
        className="p-3 md:p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            {/* Earn Icon */}
            <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white border-2 border-card overflow-hidden flex items-center justify-center">
                <Image
                  src={transaction.token?.logo_url || getTokenIcon('USDT')}
                  alt={transaction.token?.name || 'USDT'}
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
              {/* Earn indicator icon */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                  isEarnInvest ? 'bg-purple-500' : 'bg-green-500'
                }`}
              >
                {isEarnInvest ? (
                  <PiggyBank className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                ) : (
                  <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                <p className="font-semibold text-sm md:text-base">
                  {isEarnInvest ? 'Earn Investment' : 'Earn Claim'}
                </p>
                <Badge className={`${blockchainStatus.color} text-xs md:text-sm px-1.5 md:px-2 py-0 md:py-0.5 flex items-center gap-1`}>
                  {blockchainStatus.label === 'Confirming' && (
                    <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                  )}
                  {blockchainStatus.label}
                </Badge>
              </div>

              {/* Vault name */}
              {metadata && 'vault_title' in metadata && metadata.vault_title && (
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {metadata.vault_title}
                </p>
              )}

              <p className="text-xs md:text-sm text-muted-foreground">
                {formatDate(transaction.created_at)}
              </p>
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-right shrink-0">
            <p
              className={`text-base md:text-lg font-semibold ${
                isEarnInvest ? 'text-purple-500' : 'text-green-500'
              }`}
            >
              {isEarnInvest ? '-' : '+'}{transaction.amount}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">USDT</p>
            {isEarnClaim && metadata?.profit && (
              <p className="text-xs md:text-sm text-green-500 mt-0.5">
                +{metadata.profit} profit
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // For copy trade transactions (start/stop)
  if (isCopyTradeStart || isCopyTradeStop) {
    const metadata = transaction.metadata;
    return (
      <Card
        className="p-3 md:p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            {/* Copy Trade Icon */}
            <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white border-2 border-card overflow-hidden flex items-center justify-center">
                <Image
                  src={transaction.token?.logo_url || getTokenIcon('USDT')}
                  alt={transaction.token?.name || 'USDT'}
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
              {/* Copy Trade indicator icon */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                  isCopyTradeStart ? 'bg-blue-500' : 'bg-green-500'
                }`}
              >
                <Users2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                <p className="font-semibold text-sm md:text-base">
                  {isCopyTradeStart ? 'Start Copying' : 'Stop Copying'}
                </p>
                <Badge className={`${blockchainStatus.color} text-xs md:text-sm px-1.5 md:px-2 py-0 md:py-0.5 flex items-center gap-1`}>
                  {blockchainStatus.label === 'Confirming' && (
                    <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                  )}
                  {blockchainStatus.label}
                </Badge>
              </div>

              {/* Trader name */}
              {metadata && 'trader_name' in metadata && metadata.trader_name && (
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {metadata.trader_name}
                </p>
              )}

              <p className="text-xs md:text-sm text-muted-foreground">
                {formatDate(transaction.created_at)}
              </p>
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-right shrink-0">
            <p
              className={`text-base md:text-lg font-semibold ${
                isCopyTradeStart ? 'text-blue-500' : 'text-green-500'
              }`}
            >
              {isCopyTradeStart ? '-' : '+'}{transaction.amount}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">USDT</p>
            {isCopyTradeStop && metadata && 'user_profit_after_fee' in metadata && metadata.user_profit_after_fee && (
              <p className="text-xs md:text-sm text-green-500 mt-0.5">
                +{metadata.user_profit_after_fee} profit
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Regular deposit/withdrawal layout
  return (
    <Card
      className="p-3 md:p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
          {/* Coin Icon with Arrow Indicator */}
          <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white border-2 border-card overflow-hidden">
              <Image
                src={transaction.token?.logo_url || getTokenIcon(transaction.coin_symbol)}
                alt={transaction.token?.name || transaction.coin_symbol}
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
            {/* Small arrow indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                isDeposit ? 'bg-green-500' : 'bg-blue-500'
              }`}
            >
              {isDeposit ? (
                <ArrowDownLeft className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              ) : (
                <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
              <p className="font-semibold capitalize text-sm md:text-base">
                {transaction.type === 'withdrawal' ? 'Send' : transaction.type}
              </p>
              <Badge className={`${blockchainStatus.color} text-xs md:text-sm px-1.5 md:px-2 py-0 md:py-0.5 flex items-center gap-1`}>
                {blockchainStatus.label === 'Confirming' && (
                  <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                )}
                {blockchainStatus.label}
              </Badge>
            </div>

            {blockchainStatus.sublabel && (
              <p className="text-xs md:text-sm text-muted-foreground mb-1">
                {blockchainStatus.sublabel}
              </p>
            )}

            <p className="text-xs md:text-sm text-muted-foreground">
              {formatDate(transaction.created_at)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={`text-base md:text-lg font-semibold ${
              isDeposit ? 'text-green-500' : 'text-blue-500'
            }`}
          >
            {isDeposit ? '+' : '-'}{transaction.amount}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">{transaction.coin_symbol}</p>
          {transaction.network_fee && parseFloat(transaction.network_fee) > 0 && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Fee: {transaction.network_fee}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Transaction Detail Drawer Component
 * Shows comprehensive transaction details in a responsive drawer
 */

"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  FileText,
  PiggyBank,
  TrendingUp,
  Users2,
} from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCrypto, formatUSD, shortenAddress } from "@/lib/utils/currency";
import type { Transaction } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { getCoinIconPath } from "@/lib/constants/coins";
import Image from "next/image";

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coinPrice?: number;
}

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  coinPrice,
}: TransactionDetailDrawerProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  if (!transaction) return null;

  const isDeposit = transaction.type === "deposit";
  const isSwap = transaction.type === "swap";
  const isEarnInvest = transaction.type === "earn_invest";
  const isEarnClaim = transaction.type === "earn_claim";
  const isCopyTradeStart = transaction.type === "copy_trade_start";
  const isCopyTradeStop = transaction.type === "copy_trade_stop";
  const amount = parseFloat(transaction.amount);
  const usdValue = coinPrice ? amount * coinPrice : 0;
  const metadata = transaction.metadata;

  // Blockchain status mapping (no admin terminology)
  const getBlockchainStatus = (status: string, type: string) => {
    if (type === "withdrawal") {
      const statusMap: Record<
        string,
        { label: string; sublabel: string; color: string }
      > = {
        pending: {
          label: "Confirming",
          sublabel: "Broadcasting to network",
          color: "bg-yellow-500/10 text-yellow-500",
        },
        admin_approved: {
          label: "Confirming",
          sublabel: "Processing on blockchain",
          color: "bg-yellow-500/10 text-yellow-500",
        },
        super_admin_approved: {
          label: "Confirming",
          sublabel: "Awaiting confirmations",
          color: "bg-yellow-500/10 text-yellow-500",
        },
        completed: {
          label: "Confirmed",
          sublabel: "Transaction complete",
          color: "bg-green-500/10 text-green-500",
        },
        failed: {
          label: "Failed",
          sublabel: "Transaction failed",
          color: "bg-red-500/10 text-red-500",
        },
        rejected: {
          label: "Failed",
          sublabel: "Transaction rejected",
          color: "bg-red-500/10 text-red-500",
        },
        cancelled: {
          label: "Cancelled",
          sublabel: "Transaction cancelled",
          color: "bg-gray-500/10 text-gray-500",
        },
      };
      return statusMap[status] || statusMap["pending"];
    }

    const simpleStatusMap: Record<
      string,
      { label: string; sublabel: string; color: string }
    > = {
      pending: {
        label: "Confirming",
        sublabel: "Processing on blockchain",
        color: "bg-yellow-500/10 text-yellow-500",
      },
      completed: {
        label: "Confirmed",
        sublabel: "Transaction complete",
        color: "bg-green-500/10 text-green-500",
      },
      failed: {
        label: "Failed",
        sublabel: "Transaction failed",
        color: "bg-red-500/10 text-red-500",
      },
      cancelled: {
        label: "Cancelled",
        sublabel: "Transaction cancelled",
        color: "bg-gray-500/10 text-gray-500",
      },
    };
    return simpleStatusMap[status] || simpleStatusMap["pending"];
  };

  const blockchainStatus = getBlockchainStatus(
    transaction.status,
    transaction.type
  );

  const copyTxHash = async () => {
    if (transaction.tx_hash) {
      await navigator.clipboard.writeText(transaction.tx_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const copyAddress = async () => {
    const address = isDeposit
      ? transaction.to_address
      : transaction.from_address;
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const getBlockExplorerUrl = (txHash: string, coin: string): string => {
    const explorers: Record<string, string> = {
      BTC: `https://blockstream.info/testnet/tx/${txHash}`,
      ETH: `https://sepolia.etherscan.io/tx/${txHash}`,
      USDT: `https://tronscan.io/#/transaction/${txHash}`,
      DOGE: `https://blockexplorer.one/dogecoin/testnet/tx/${txHash}`,
      TRX: `https://shasta.tronscan.org/#/transaction/${txHash}`,
      LTC: `https://blockexplorer.one/litecoin/testnet/tx/${txHash}`,
    };
    return explorers[coin] || "#";
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Transaction Details</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isSwap
              ? `Swap • ${transaction.swap_from_coin} → ${transaction.swap_to_coin}`
              : isEarnInvest
                ? `Earn Investment • ${metadata && "vault_title" in metadata ? metadata.vault_title : "Vault"}`
                : isEarnClaim
                  ? `Earn Claim • ${metadata && "vault_title" in metadata ? metadata.vault_title : "Vault"}`
                  : isCopyTradeStart
                    ? `Copy Trade • Start Copying ${metadata && "trader_name" in metadata ? metadata.trader_name : "Trader"}`
                    : isCopyTradeStop
                      ? `Copy Trade • Stop Copying ${metadata && "trader_name" in metadata ? metadata.trader_name : "Trader"}`
                      : `${isDeposit ? "Deposit" : "Withdrawal"} • ${transaction.coin_symbol}`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Status Section */}
          <div className="text-center py-6 bg-bg-secondary rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
              {isSwap ? (
                // Stacked coins for swaps
                <div className="relative w-20 h-20">
                  {/* From coin (back) */}
                  <div className="absolute top-0 left-2 w-14 h-14 rounded-full bg-white border-4 border-bg-secondary overflow-hidden shadow-md">
                    <Image
                      src={getCoinIconPath(
                        transaction.swap_from_coin || transaction.coin_symbol
                      )}
                      alt={
                        transaction.swap_from_coin || transaction.coin_symbol
                      }
                      width={56}
                      height={56}
                      className="w-full h-full"
                    />
                  </div>
                  {/* To coin (front, offset) */}
                  <div className="absolute bottom-0 right-2 w-14 h-14 rounded-full bg-white border-4 border-bg-secondary overflow-hidden shadow-lg">
                    <Image
                      src={getCoinIconPath(transaction.swap_to_coin || "")}
                      alt={transaction.swap_to_coin || ""}
                      width={56}
                      height={56}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Swap arrow indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-md z-10">
                    <ArrowLeftRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : isEarnInvest || isEarnClaim ? (
                // Earn icon for earn transactions
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-bg-secondary overflow-hidden shadow-md">
                    <Image
                      src={getCoinIconPath("USDT")}
                      alt="USDT"
                      width={64}
                      height={64}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Earn indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      isEarnInvest ? "bg-purple-500" : "bg-green-500"
                    }`}
                  >
                    {isEarnInvest ? (
                      <PiggyBank className="w-4 h-4 text-white" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              ) : isCopyTradeStart || isCopyTradeStop ? (
                // Copy Trade icon for copy trade transactions
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-bg-secondary overflow-hidden shadow-md">
                    <Image
                      src={getCoinIconPath("USDT")}
                      alt="USDT"
                      width={64}
                      height={64}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Copy Trade indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      isCopyTradeStart ? "bg-blue-500" : "bg-green-500"
                    }`}
                  >
                    <Users2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                // Single coin for deposits/withdrawals
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-bg-secondary overflow-hidden shadow-md">
                    <Image
                      src={getCoinIconPath(transaction.coin_symbol)}
                      alt={transaction.coin_symbol}
                      width={64}
                      height={64}
                      className="w-full h-full"
                    />
                  </div>
                  {/* Arrow indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      isDeposit ? "bg-green-500" : "bg-blue-500"
                    }`}
                  >
                    {isDeposit ? (
                      <ArrowDownLeft className="w-4 h-4 text-white" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <Badge
              className={`${blockchainStatus.color} text-sm px-3 py-1 flex items-center gap-2 mx-auto w-fit`}
            >
              {blockchainStatus.label === "Confirming" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {blockchainStatus.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {blockchainStatus.sublabel}
            </p>
          </div>

          {/* Amount Section - Different for Swaps and Earn */}
          {isSwap ? (
            <div className="text-center py-4 border-y border-bg-tertiary space-y-4">
              {/* You Sent */}
              <div>
                <p className="text-xs text-text-tertiary mb-1">You Sent</p>
                <p className="text-xl font-semibold text-blue-500">
                  -
                  {transaction.swap_from_amount?.toFixed(8) ||
                    transaction.amount}
                </p>
                <p className="text-sm text-text-secondary">
                  {transaction.swap_from_coin || transaction.coin_symbol}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowDownLeft className="w-5 h-5 text-text-tertiary rotate-90" />
              </div>

              {/* You Received */}
              <div>
                <p className="text-xs text-text-tertiary mb-1">You Received</p>
                <p className="text-2xl font-bold text-green-500">
                  +{transaction.swap_to_amount?.toFixed(8) || "0"}
                </p>
                <p className="text-lg text-text-secondary">
                  {transaction.swap_to_coin}
                </p>
              </div>

              {/* Exchange Rate */}
              {transaction.swap_rate && (
                <div className="pt-2 border-t border-bg-tertiary">
                  <p className="text-xs text-text-tertiary">Exchange Rate</p>
                  <p className="text-sm text-text-secondary mt-1">
                    1 {transaction.swap_from_coin} ={" "}
                    {transaction.swap_rate.toFixed(8)}{" "}
                    {transaction.swap_to_coin}
                  </p>
                </div>
              )}
            </div>
          ) : isEarnInvest || isEarnClaim ? (
            <div className="text-center py-4 border-y border-bg-tertiary space-y-4">
              {/* Total Amount */}
              <div>
                <p className="text-xs text-text-tertiary mb-1">
                  {isEarnInvest ? "Invested Amount" : "Total Claimed"}
                </p>
                <p
                  className={`text-3xl font-bold ${isEarnInvest ? "text-purple-500" : "text-green-500"}`}
                >
                  {isEarnInvest ? "-" : "+"}
                  {formatCrypto(amount, "USDT")}
                </p>
                <p className="text-lg text-text-secondary mt-1">USDT</p>
              </div>

              {/* Earn Claim Breakdown */}
              {isEarnClaim && metadata && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-bg-tertiary">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Principal</p>
                    <p className="text-sm font-semibold">
                      {metadata.principal
                        ? formatCrypto(metadata.principal, "USDT")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Profit</p>
                    <p className="text-sm font-semibold text-green-500">
                      +
                      {metadata.profit
                        ? formatCrypto(metadata.profit, "USDT")
                        : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Investment Details */}
              {isEarnInvest && metadata && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-bg-tertiary">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">APY</p>
                    <p className="text-sm font-semibold text-brand-primary">
                      {metadata.apy}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Duration</p>
                    <p className="text-sm font-semibold">
                      {metadata.duration_months}{" "}
                      {metadata.duration_months === 1 ? "month" : "months"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : isCopyTradeStart || isCopyTradeStop ? (
            <div className="text-center py-4 border-y border-bg-tertiary space-y-4">
              {/* Total Amount */}
              <div>
                <p className="text-xs text-text-tertiary mb-1">
                  {isCopyTradeStart ? "Allocation Amount" : "Total Received"}
                </p>
                <p
                  className={`text-3xl font-bold ${isCopyTradeStart ? "text-blue-500" : "text-green-500"}`}
                >
                  {isCopyTradeStart ? "-" : "+"}
                  {formatCrypto(amount, "USDT")}
                </p>
                <p className="text-lg text-text-secondary mt-1">USDT</p>
              </div>

              {/* Copy Trade Stop Breakdown */}
              {isCopyTradeStop && metadata && "allocation" in metadata && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-bg-tertiary">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">
                      Allocation
                    </p>
                    <p className="text-sm font-semibold">
                      {metadata.allocation
                        ? formatCrypto(metadata.allocation, "USDT")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">
                      Your Profit
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        metadata.user_profit_after_fee &&
                        metadata.user_profit_after_fee > 0
                          ? "text-green-500"
                          : "text-action-red"
                      }`}
                    >
                      {metadata.user_profit_after_fee &&
                      metadata.user_profit_after_fee > 0
                        ? "+"
                        : ""}
                      {metadata.user_profit_after_fee
                        ? formatCrypto(metadata.user_profit_after_fee, "USDT")
                        : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Performance Fee Details */}
              {isCopyTradeStop &&
                metadata &&
                'trader_fee' in metadata &&
                metadata.trader_fee !== undefined && (
                  <div className="pt-2 border-t border-bg-tertiary text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-text-tertiary">
                        Performance Fee ({metadata.performance_fee_percent || 0}
                        %)
                      </span>
                      <span className="font-semibold">
                        {metadata.trader_fee
                          ? formatCrypto(metadata.trader_fee, "USDT")
                          : "—"}
                      </span>
                    </div>
                  </div>
                )}

              {/* Trader Details */}
              {metadata && 'trader_name' in metadata && metadata?.trader_name && (
                <div className="pt-2 border-t border-bg-tertiary">
                  <p className="text-xs text-text-tertiary mb-1">Trader</p>
                  <p className="text-sm font-semibold">
                    {metadata.trader_name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 border-y border-bg-tertiary">
              <p className="text-sm text-text-secondary mb-1">Amount</p>
              <p
                className={`text-3xl font-bold ${isDeposit ? "text-green-500" : "text-blue-500"}`}
              >
                {isDeposit ? "+" : "-"}
                {formatCrypto(amount, transaction.coin_symbol)}
              </p>
              <p className="text-lg text-text-secondary mt-1">
                {transaction.coin_symbol}
              </p>
              {coinPrice && (
                <p className="text-sm text-text-tertiary mt-2">
                  {formatUSD(usdValue)}
                </p>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Transaction Hash */}
            {transaction.tx_hash && (
              <div>
                <p className="text-xs font-medium text-text-secondary mb-2">
                  Transaction Hash
                </p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-sm bg-bg-secondary p-3 rounded-lg truncate">
                    {transaction.tx_hash}
                  </p>
                  <Button variant="outline" size="icon" onClick={copyTxHash}>
                    {copiedHash ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={getBlockExplorerUrl(
                        transaction.tx_hash,
                        transaction.coin_symbol
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Maturity Date for Earn Invest */}
            {isEarnInvest && metadata && 'matures_at' in metadata && metadata.matures_at && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Matures At</span>
                <span className="font-medium text-sm">
                  {format(
                    new Date(metadata.matures_at),
                    "MMM d, yyyy • h:mm a"
                  )}
                </span>
              </div>
            )}

            {/* Vault Name for Earn */}
            {(isEarnInvest || isEarnClaim) && metadata && 'vault_title' in metadata && metadata.vault_title && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Vault</span>
                <span className="font-medium text-sm">
                  {metadata.vault_title}
                </span>
              </div>
            )}

            {/* Address */}
            {(transaction.to_address || transaction.from_address) && (
              <div>
                <p className="text-xs font-medium text-text-secondary mb-2">
                  {isDeposit ? "To Address" : "From Address"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-sm bg-bg-secondary p-3 rounded-lg truncate">
                    {isDeposit
                      ? transaction.to_address
                      : transaction.from_address}
                  </p>
                  <Button variant="outline" size="icon" onClick={copyAddress}>
                    {copiedAddress ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Network Fee or Swap Fee */}
            {isSwap && transaction.swap_fee_percentage ? (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">
                  Swap Fee ({transaction.swap_fee_percentage}%)
                </span>
                <span className="font-medium text-sm">
                  {(
                    (transaction.swap_from_amount ||
                      parseFloat(transaction.amount)) *
                    (transaction.swap_fee_percentage / 100)
                  ).toFixed(8)}{" "}
                  {transaction.swap_from_coin}
                </span>
              </div>
            ) : transaction.network_fee &&
              parseFloat(transaction.network_fee) > 0 ? (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Network Fee</span>
                <span className="font-medium text-sm">
                  {transaction.network_fee} {transaction.coin_symbol}
                </span>
              </div>
            ) : null}

            {/* Created Date */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-secondary">Date</span>
              <span className="font-medium text-sm">
                {format(
                  new Date(transaction.created_at),
                  "MMM d, yyyy • h:mm a"
                )}
              </span>
            </div>

            {/* Completed Date */}
            {transaction.completed_at && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Completed</span>
                <span className="font-medium text-sm">
                  {format(
                    new Date(transaction.completed_at),
                    "MMM d, yyyy • h:mm a"
                  )}
                </span>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="border-t border-bg-tertiary pt-4">
                <div className="rounded-lg border border-bg-tertiary bg-bg-secondary/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        Transaction Notes
                      </p>
                      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                        {transaction.notes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/**
 * CopyPositionCard Component
 * Displays a copy position: P&L, allocation, and stop action or closed summary
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { TraderAvatar } from "./TraderAvatar";
import Link from "next/link";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { useStopCopyTrade } from "@/hooks/useCopyTrade";
import { cn } from "@/lib/utils";
import { formatChange, formatUSD } from "@/lib/utils/currency";
import { calcPayout, formatRelativeTime } from "@/lib/copy-trade/format";
import type { CopyPosition } from "@/types/copy-trade";

interface CopyPositionCardProps {
  position: CopyPosition;
  /** Timestamp (ms) of the last positions refresh, for active positions */
  updatedAt?: number;
}

const pnlColor = (value: number) =>
  value >= 0 ? "text-action-green" : "text-action-red";

export function CopyPositionCard({ position, updatedAt }: CopyPositionCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const stopMutation = useStopCopyTrade();

  const isActive = position.status === "active";
  const allocation = position.allocation_usdt;
  const feePercent = position.trader.performance_fee_percent;
  // For closed positions final_pnl is net of the performance fee
  const pnl = isActive ? position.current_pnl : position.final_pnl ?? position.current_pnl;
  const totalValue = allocation + pnl;
  const pnlPercent = allocation > 0 ? (pnl / allocation) * 100 : 0;
  const isProfit = pnl >= 0;
  const payout = calcPayout(allocation, pnl, feePercent);

  const feePaid = position.performance_fee_paid ?? 0;
  const grossPnl = pnl + feePaid;

  const endDate = position.stopped_at ? new Date(position.stopped_at) : new Date();
  const daysActive = Math.max(
    0,
    Math.floor(
      (endDate.getTime() - new Date(position.started_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const handleConfirmStop = async () => {
    setConfirmDialogOpen(false);
    try {
      await stopMutation.mutateAsync(position.id);
    } catch {
      // Error toast is handled by the hook
    }
  };

  return (
    <Card
      className={cn(
        isActive && "border-brand-primary/30",
        position.status === "liquidated" && "border-action-red/30"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/copy-trade/${position.trader.id}`}
            className="flex items-center gap-3 min-w-0 group"
          >
            <TraderAvatar
              name={position.trader.name}
              src={position.trader.avatar_url}
              className="h-10 w-10"
            />
            <div className="min-w-0">
              <CardTitle className="text-base md:text-lg truncate group-hover:text-brand-primary transition-colors">
                {position.trader.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {position.trader.strategy} • {daysActive} {daysActive === 1 ? "day" : "days"}
              </CardDescription>
            </div>
          </Link>

          {isActive && (
            <Badge
              variant="outline"
              className="shrink-0 bg-action-green/10 text-action-green border-action-green/30"
            >
              <Radio className="h-3 w-3 mr-1 animate-pulse" />
              Active
            </Badge>
          )}
          {position.status === "stopped" && (
            <Badge variant="outline" className="shrink-0 bg-bg-tertiary text-text-secondary">
              Stopped
            </Badge>
          )}
          {position.status === "liquidated" && (
            <Badge
              variant="outline"
              className="shrink-0 bg-action-red/10 text-action-red border-action-red/30"
            >
              Liquidated
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* PnL Display */}
        <div
          className={`p-4 rounded-lg ${isProfit ? "bg-action-green/10" : "bg-action-red/10"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              {isActive ? "Profit/Loss" : "Net Profit/Loss"}
            </span>
            {isActive && updatedAt ? (
              <span className="text-xs text-text-tertiary">
                Updated {formatRelativeTime(updatedAt)}
              </span>
            ) : null}
          </div>
          <div className="flex items-baseline gap-2">
            {isProfit ? (
              <TrendingUp className="h-5 w-5 text-action-green self-center" />
            ) : (
              <TrendingDown className="h-5 w-5 text-action-red self-center" />
            )}
            <span className={`text-2xl font-bold ${pnlColor(pnl)}`}>
              {formatChange(pnl)}
            </span>
            <span className={`text-sm ${pnlColor(pnl)}`}>
              ({formatChange(pnlPercent, true)})
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-tertiary mb-1">Allocation</p>
            <p className="font-semibold">{formatUSD(allocation)}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">
              {isActive ? "Current Value" : "Returned"}
            </p>
            <p className="font-semibold">{formatUSD(totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Perf. Fee</p>
            <p className="font-semibold">{feePercent}%</p>
          </div>
        </div>

        {/* Payout preview (active, in profit) */}
        {isActive && payout.fee > 0 && (
          <div className="text-xs text-text-tertiary bg-bg-tertiary p-3 rounded-lg">
            <p>
              If you stop now, you&apos;ll receive{" "}
              <span className="font-semibold text-text-primary">
                {formatUSD(payout.net)}
              </span>{" "}
              after the {feePercent}% performance fee
            </p>
          </div>
        )}

        {/* Closed Position Breakdown */}
        {!isActive && feePaid > 0 && (
          <div className="bg-bg-tertiary p-3 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Gross P&L</span>
              <span className={`font-semibold ${pnlColor(grossPnl)}`}>
                {formatChange(grossPnl)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Performance Fee</span>
              <span className="font-semibold text-text-secondary">
                -{formatUSD(feePaid)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-bg-primary">
              <span className="text-text-tertiary">Net P&L</span>
              <span className={`font-semibold ${pnlColor(pnl)}`}>
                {formatChange(pnl)}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isActive && (
          <Button
            onClick={() => setConfirmDialogOpen(true)}
            disabled={stopMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {stopMutation.isPending ? "Stopping..." : "Stop Copying"}
          </Button>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      {isActive && (
        <ConfirmActionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleConfirmStop}
          title="Stop Copying Trader"
          description={`Are you sure you want to stop copying ${position.trader.name}? Your position will be closed and funds returned to your wallet.`}
          details={[
            { label: "Trader", value: position.trader.name },
            { label: "Strategy", value: position.trader.strategy },
            { label: "Allocation", value: `${formatUSD(allocation)} USDT` },
            {
              label: "Current P&L",
              value: (
                <span className={pnlColor(pnl)}>
                  {formatChange(pnl)} ({formatChange(pnlPercent, true)})
                </span>
              ),
              highlight: true,
            },
            ...(payout.fee > 0
              ? [
                  {
                    label: "Performance Fee",
                    value: `-${formatUSD(payout.fee)} USDT`,
                  },
                ]
              : []),
            {
              label: "You'll Receive",
              value: `${formatUSD(payout.net)} USDT`,
              highlight: true,
            },
          ]}
          confirmText="Stop Copying"
          variant="destructive"
          loading={stopMutation.isPending}
        />
      )}
    </Card>
  );
}

/**
 * CopyPositionCard Component
 * Displays user's copy position with live PnL counter
 */

"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import Image from "next/image";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";

interface Position {
  id: string;
  allocation_usdt: number;
  current_pnl: number;
  daily_pnl_rate: number;
  status: "active" | "stopped" | "liquidated";
  started_at: string;
  stopped_at?: string;
  final_pnl?: number;
  performance_fee_paid?: number;
  trader: {
    id: string;
    name: string;
    avatar_url: string;
    strategy: string;
    performance_fee_percent: number;
    risk_level: string;
  };
}

interface CopyPositionCardProps {
  position: Position;
  onStop?: () => void;
}

export function CopyPositionCard({ position, onStop }: CopyPositionCardProps) {
  const [livePnl, setLivePnl] = useState(position.current_pnl);
  const [stopping, setStopping] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Update P&L when position data changes
  useEffect(() => {
    setLivePnl(position.current_pnl);
  }, [position.current_pnl]);

  const handleStopClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmStop = async () => {
    setStopping(true);
    setConfirmDialogOpen(false);

    try {
      const response = await fetch("/api/copy-trade/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId: position.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop copying");
      }

      toast.success(data.message);
      if (onStop) onStop();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to stop copying"
      );
    } finally {
      setStopping(false);
    }
  };

  const allocation = Number(position.allocation_usdt);
  const pnl = position.status === "active" ? livePnl : position.final_pnl || 0;
  const totalValue = allocation + pnl;
  const pnlPercent = (pnl / allocation) * 100;
  const isProfit = pnl >= 0;

  const daysActive = Math.floor(
    (new Date().getTime() - new Date(position.started_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className={position.status === "active" ? "border-brand-primary/30" : ""}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-bg-tertiary">
              <Image
                src={position.trader.avatar_url || "/placeholder-avatar.png"}
                alt={position.trader.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-lg">{position.trader.name}</CardTitle>
              <CardDescription className="text-xs">
                {position.trader.strategy} • {daysActive} days
              </CardDescription>
            </div>
          </div>

          {position.status === "active" && (
            <Badge
              variant="outline"
              className="bg-action-green/10 text-action-green border-action-green/30"
            >
              <Radio className="h-3 w-3 mr-1 animate-pulse" />
              Active
            </Badge>
          )}
          {position.status === "stopped" && (
            <Badge
              variant="outline"
              className="bg-bg-tertiary text-text-secondary"
            >
              Stopped
            </Badge>
          )}
          {position.status === "liquidated" && (
            <Badge
              variant="outline"
              className="bg-action-red/10 text-action-red border-action-red/30"
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
            <span className="text-sm text-text-secondary">Profit/Loss</span>
            {position.status === "active" && (
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <Radio className="h-3 w-3 text-brand-primary animate-pulse" />
                Updates every 5min
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            {isProfit ? (
              <TrendingUp className="h-5 w-5 text-action-green" />
            ) : (
              <TrendingDown className="h-5 w-5 text-action-red" />
            )}
            <span
              className={`text-2xl font-bold ${
                isProfit ? "text-action-green" : "text-action-red"
              }`}
            >
              {isProfit ? "+" : ""}${pnl.toFixed(2)}
            </span>
            <span
              className={`text-sm ${
                isProfit ? "text-action-green" : "text-action-red"
              }`}
            >
              ({isProfit ? "+" : ""}
              {pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-tertiary mb-1">Allocation</p>
            <p className="font-semibold">${allocation.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Current Value</p>
            <p className="font-semibold">${totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-1">Perf. Fee</p>
            <p className="font-semibold">
              {position.trader.performance_fee_percent}%
            </p>
          </div>
        </div>

        {/* Performance Fee Info (if profit) */}
        {position.status === "active" && isProfit && pnl > 0 && (
          <div className="text-xs text-text-tertiary bg-bg-tertiary p-3 rounded-lg">
            <p>
              If you stop now, you&apos;ll receive{" "}
              <span className="font-semibold text-text-primary">
                $
                {(
                  allocation +
                  pnl * (1 - position.trader.performance_fee_percent / 100)
                ).toFixed(2)}
              </span>{" "}
              after {position.trader.performance_fee_percent}% performance fee
            </p>
          </div>
        )}

        {/* Stopped Position Summary */}
        {position.status === "stopped" &&
          position.performance_fee_paid !== undefined && (
            <div className="bg-bg-tertiary p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Profit</span>
                <span className="font-semibold text-action-green">
                  +${(pnl + (position.performance_fee_paid || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Performance Fee</span>
                <span className="font-semibold text-text-secondary">
                  -${(position.performance_fee_paid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-bg-primary">
                <span className="text-text-tertiary">Net Profit</span>
                <span className="font-semibold text-action-green">
                  +${pnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}

        {/* Action Button */}
        {position.status === "active" && (
          <Button
            onClick={handleStopClick}
            disabled={stopping}
            variant="outline"
            className="w-full"
          >
            {stopping ? "Stopping..." : "Stop Copying"}
          </Button>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmStop}
        title="Stop Copying Trader"
        description={`Are you sure you want to stop copying ${position.trader.name}? Your position will be closed and funds returned to your wallet.`}
        details={[
          { label: "Trader", value: position.trader.name },
          { label: "Strategy", value: position.trader.strategy },
          { label: "Allocation", value: `$${allocation.toFixed(2)} USDT` },
          {
            label: "Current P&L",
            value: (
              <span className={isProfit ? "text-action-green" : "text-action-red"}>
                {isProfit ? "+" : ""}${pnl.toFixed(2)} ({isProfit ? "+" : ""}
                {pnlPercent.toFixed(2)}%)
              </span>
            ),
            highlight: true,
          },
          ...(isProfit && pnl > 0
            ? [
                {
                  label: "Performance Fee",
                  value: `${(pnl * (position.trader.performance_fee_percent / 100)).toFixed(2)} USDT`,
                },
                {
                  label: "You'll Receive",
                  value: `$${(allocation + pnl * (1 - position.trader.performance_fee_percent / 100)).toFixed(2)} USDT`,
                  highlight: true,
                },
              ]
            : [
                {
                  label: "You'll Receive",
                  value: `$${totalValue.toFixed(2)} USDT`,
                  highlight: true,
                },
              ]),
        ]}
        confirmText="Stop Copying"
        variant="destructive"
        loading={stopping}
      />
    </Card>
  );
}

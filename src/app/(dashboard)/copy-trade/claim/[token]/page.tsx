/**
 * Waitlist Claim Page
 * Allows users to claim their spot from email link
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";

interface Trader {
  id: string;
  name: string;
  avatar_url: string;
  strategy: string;
  historical_roi_min: number;
  historical_roi_max: number;
  performance_fee_percent: number;
  risk_level: string;
  max_drawdown: number;
  stats: {
    monthly_roi?: number;
  };
}

interface ClaimData {
  trader: Trader;
  expires_at: string;
  time_remaining: {
    hours: number;
    minutes: number;
  };
}

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/copy-trade/claim?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired claim");
      }

      setClaimData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate claim");
      toast.error(err instanceof Error ? err.message : "Invalid claim link");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claimData) return;

    const allocationAmount = parseFloat(amount);
    if (isNaN(allocationAmount) || allocationAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setClaiming(true);

    try {
      const response = await fetch("/api/copy-trade/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          amount: allocationAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim spot");
      }

      toast.success(data.message);
      router.push("/copy-trade");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to claim spot"
      );
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !claimData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-action-red/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-action-red" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Claim Expired or Invalid
              </h3>
              <p className="text-text-secondary">
                {error || "This claim link is no longer valid"}
              </p>
            </div>
            <Button
              onClick={() => router.push("/copy-trade")}
              variant="outline"
            >
              Back to Copy Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trader = claimData.trader;
  const monthlyRoi =
    trader.stats?.monthly_roi ||
    (trader.historical_roi_min + trader.historical_roi_max) / 2;

  return (
    <div className="min-h-screen p-4 pt-16 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success Header */}
        <Card className="border-action-green/30 bg-action-green/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-action-green/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-action-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Your Spot is Ready!</h1>
              <p className="text-text-secondary">
                A spot has opened for <strong>{trader.name}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Remaining */}
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-semibold">
                {claimData.time_remaining.hours}h{" "}
                {claimData.time_remaining.minutes}m remaining
              </p>
              <p className="text-xs text-text-tertiary">
                Claim before {new Date(claimData.expires_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trader Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-bg-tertiary flex-shrink-0">
                <Image
                  src={trader.avatar_url || "/placeholder-avatar.png"}
                  alt={trader.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{trader.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{trader.strategy}</Badge>
                  <Badge variant="outline">
                    {trader.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <TrendingUp className="h-5 w-5 text-action-green" />
                <div>
                  <p className="text-xs text-text-tertiary">Monthly ROI</p>
                  <p className="font-bold text-action-green">
                    +{monthlyRoi.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                <Zap className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Performance Fee</p>
                  <p className="font-bold">{trader.performance_fee_percent}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg col-span-2">
                <AlertTriangle className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-xs text-text-tertiary">Max Drawdown</p>
                  <p className="font-bold text-action-red">
                    -{(trader.max_drawdown * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim Form */}
        <Card>
          <CardHeader>
            <CardTitle>Confirm Your Allocation</CardTitle>
            <CardDescription>
              Enter the amount you want to allocate to start copying
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleClaim} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Allocation Amount (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-text-tertiary">
                  Performance fee of {trader.performance_fee_percent}% will be
                  charged on profits
                </p>
              </div>

              <div className="p-4 bg-bg-tertiary rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Your Allocation</span>
                  <span className="font-semibold">
                    ${amount || "0.00"} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Performance Fee</span>
                  <span className="font-semibold">
                    {trader.performance_fee_percent}% on profits
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={claiming || !amount}
                className="w-full bg-action-green hover:bg-action-green-dark"
              >
                {claiming
                  ? "Processing..."
                  : `Claim Spot & Copy ${trader.name}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-bg-tertiary/50">
          <CardContent className="p-4 text-xs text-text-tertiary">
            <p>
              <strong>Important:</strong> If you don&apos;t claim within the
              time limit, this spot will be offered to the next person in the
              waitlist.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

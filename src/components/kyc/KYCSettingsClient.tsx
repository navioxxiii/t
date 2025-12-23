/**
 * KYC Settings Client Component
 * View KYC status, transaction limits, and upgrade tier
 */

'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Clock,
  XCircle,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface KYCStatus {
  kyc_status: string;
  kyc_tier: string | null;
  kyc_verified_at: string | null;
  kyc_rejection_reason: string | null;
  latest_submission: Record<string, unknown> | null;
  limits: {
    tier: string;
    daily_limit_usd: number;
    monthly_limit_usd: number;
    single_transaction_limit_usd: number;
    daily_spent_usd: number;
    remaining_daily_limit_usd: number;
    can_deposit: boolean;
    can_withdraw: boolean;
    can_swap: boolean;
    can_send: boolean;
    can_earn: boolean;
    can_copy_trade: boolean;
  } | null;
}

export default function KYCSettingsClient() {
  const profile = useAuthStore((state) => state.profile);
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await fetch("/api/kyc/status");
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const status = kycStatus?.kyc_status || "not_started";
  const tier = kycStatus?.kyc_tier;
  const limits = kycStatus?.limits;

  const getStatusBadge = () => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-action-green/10 text-action-green border-action-green/30">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
      case "under_review":
        return (
          <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/30">
            <Clock className="w-3 h-3 mr-1" />
            {status === "under_review" ? "Under Review" : "Pending"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-action-red/10 text-action-red border-action-red/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-bg-tertiary text-text-secondary border-bg-tertiary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const getTierDisplay = () => {
    if (!tier) return "None";
    if (tier === "tier_1_basic") return "Basic Verification";
    if (tier === "tier_2_advanced") return "Elite Membership";
    return tier;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-8 px-4 pt-nav">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Identity Verification
          </h1>
          <p className="text-text-secondary">
            View your KYC status and transaction limits
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Verification Status
              </h2>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>

            {status === "not_started" && (
              <Button onClick={() => router.push("/kyc")}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            )}

            {status === "rejected" && (
              <Button onClick={() => router.push("/kyc")}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Resubmit
              </Button>
            )}
          </div>

          {status === "approved" && (
            <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-bg-tertiary">
              <div>
                <span className="text-sm text-text-tertiary">Tier</span>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  {getTierDisplay()}
                </p>
              </div>
              <div>
                <span className="text-sm text-text-tertiary">Verified On</span>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  {kycStatus?.kyc_verified_at
                    ? new Date(kycStatus.kyc_verified_at).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-text-tertiary">User ID</span>
                <p className="text-sm font-mono text-text-primary mt-1">
                  {profile?.id.substring(0, 8)}...
                </p>
              </div>
            </div>
          )}

          {status === "rejected" && kycStatus?.kyc_rejection_reason && (
            <div className="mt-4 p-4 bg-action-red/10 border border-action-red/30 rounded-lg">
              <p className="text-sm font-semibold text-action-red mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-text-secondary">
                {kycStatus.kyc_rejection_reason}
              </p>
            </div>
          )}

          {(status === "pending" || status === "under_review") && (
            <div className="mt-4 p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-lg">
              <p className="text-sm text-text-primary">
                Your verification is being reviewed. This usually takes 1-3
                business days. You&apos;ll receive an email notification once
                complete.
              </p>
            </div>
          )}
        </div>

        {/* Transaction Limits */}
        {limits && (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Transaction Limits
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Limit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Daily Limit
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(limits.daily_limit_usd)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                    <span>Used Today</span>
                    <span>{formatCurrency(limits.daily_spent_usd)}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        limits.daily_spent_usd / limits.daily_limit_usd > 0.8
                          ? "bg-action-red"
                          : "bg-brand-primary"
                      }`}
                      style={{
                        width: `${Math.min(
                          (limits.daily_spent_usd / limits.daily_limit_usd) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {formatCurrency(limits.remaining_daily_limit_usd)} remaining
                  </p>
                </div>
              </div>

              {/* Single Transaction Limit */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Single Transaction
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(limits.single_transaction_limit_usd)}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Maximum per transaction
                </p>
              </div>
            </div>

            {/* Features Access */}
            <div className="mt-6 pt-6 border-t border-bg-tertiary">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Available Features
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Deposit", enabled: limits.can_deposit },
                  { label: "Withdraw", enabled: limits.can_withdraw },
                  { label: "Swap", enabled: limits.can_swap },
                  { label: "Send", enabled: limits.can_send },
                  { label: "Earn", enabled: limits.can_earn },
                  { label: "Copy Trade", enabled: limits.can_copy_trade },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className={`flex items-center gap-2 text-sm p-2 rounded ${
                      feature.enabled
                        ? "text-action-green"
                        : "text-text-tertiary"
                    }`}
                  >
                    {feature.enabled ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Card (if Tier 1) */}
        {tier === "tier_1_basic" && (
          <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/30 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    Upgrade to Tier 2
                  </h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Unlock higher limits and access to copy trading
                </p>
                <ul className="space-y-2 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-brand-primary">•</span>
                    <span>$10,000 daily limit (10x increase)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-brand-primary">•</span>
                    <span>Access to copy trading</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-brand-primary">•</span>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button onClick={() => router.push("/kyc")}>
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Need Help?
          </h2>
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              <strong className="text-text-primary">
                How long does verification take?
              </strong>
              <br />
              Most verifications are completed within 1-3 business days.
            </p>
            <p>
              <strong className="text-text-primary">
                What documents do I need?
              </strong>
              <br />
              Tier 1: Basic personal information
              <br />
              Tier 2: Government-issued ID and selfie
            </p>
            <p>
              <strong className="text-text-primary">
                Can I upgrade later?
              </strong>
              <br />
              Yes! You can upgrade from Tier 1 to Tier 2 at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

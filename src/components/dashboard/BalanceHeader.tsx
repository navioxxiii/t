"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceHeaderProps {
  totalBalance: number;
  isLoading?: boolean;
  change24h?: number;
  changePercentage?: number;
}

export function BalanceHeader({
  totalBalance,
  isLoading = false,
  change24h = 0,
  changePercentage = 0,
}: BalanceHeaderProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const isPositiveChange = change24h > 0;
  const isNegativeChange = change24h < 0;

  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 bg-bg-primary">
      <div className="mx-auto max-w-4xl">
        {/* Label */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <p className="text-sm md:text-base font-medium text-text-secondary">
            Total Balance
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleBalanceVisibility}
            aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
          >
            {isBalanceVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Balance Amount */}
        <div className="flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="h-12 w-48 sm:h-14 sm:w-56 md:h-16 md:w-64 shimmer" />
          ) : (
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-text-primary">
              {isBalanceVisible ? formatUSD(totalBalance) : "••••••"}
            </h1>
          )}
        </div>

        {/* 24h Change */}
        {isLoading ? (
          <div className="mt-3 flex items-center justify-center">
            <Skeleton className="h-7 w-40 rounded-full shimmer" />
          </div>
        ) : (
          isBalanceVisible &&
          change24h !== 0 && (
            <div className="mt-3 flex items-center justify-center">
              <div
                className={`rounded-full px-3 py-1 text-sm md:text-base font-semibold ${
                  isPositiveChange
                    ? "bg-action-green/10 text-action-green"
                    : isNegativeChange
                    ? "bg-action-red/10 text-action-red"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                {isPositiveChange ? '+' : ''}
                {formatUSD(Math.abs(change24h))} (
                {isPositiveChange ? '+' : ''}
                {changePercentage.toFixed(2)}%)
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

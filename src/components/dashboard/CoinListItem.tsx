"use client";

import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";
import { formatCrypto, formatUSD, getChangeColor } from "@/lib/utils/currency";
import type { CoinPrice } from "@/lib/prices/prices-client";
import type { BaseToken } from "@/types/balance";
import { getTokenIcon } from "@/config/token-icons";

interface CoinListItemProps {
  token: BaseToken;
  balance: string;
  locked_balance: string;
  available_balance: string;
  price?: CoinPrice | null;
  priceError?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: (tokenId: number, isVisible: boolean) => void;
  networkCount?: number; // Number of networks for this token
}

export function CoinListItem({
  token,
  balance,
  locked_balance,
  available_balance,
  price,
  priceError = false,
  onClick,
  isLoading = false,
  isVisible = true,
  onToggleVisibility,
  networkCount = 0,
}: CoinListItemProps) {
  // Use total balance for USD calculation
  const totalBalance = parseFloat(balance);
  const lockedBalance = parseFloat(locked_balance);
  const availableBalance = parseFloat(available_balance);
  const hasLockedBalance = lockedBalance > 0;

  const usdValue = price ? totalBalance * price.current_price : 0;
  const priceChange = price?.price_change_percentage_24h ?? 0;
  const changeColor = getChangeColor(priceChange);

  // Use logo_url from database or fallback to icon helper
  const tokenIcon = token.logo_url || getTokenIcon(token.symbol);
  
  if (isLoading) {
    return (
      <div className="flex min-h-[72px] items-center gap-3 border-b border-bg-tertiary px-4 py-4 last:border-b-0">
        {/* Icon Skeleton - matches exact 40x40 size */}
        <div className="h-10 w-10 flex-shrink-0 rounded-full shimmer" />

        {/* Coin Info Skeleton */}
        <div className="flex-1 space-y-2">
          {/* Name - matches text-base font-semibold height */}
          <div className="h-[22px] w-24 rounded-md shimmer" />
          {/* Balance - matches text-sm height with mt-1 */}
          <div className="h-[20px] w-20 rounded-md shimmer" />
        </div>

        {/* Value & Change Skeleton */}
        <div className="space-y-2 text-right">
          {/* USD Value - matches text-base font-semibold height */}
          <div className="h-[22px] w-24 rounded-md shimmer ml-auto" />
          {/* Percentage - matches text-xs height with mt-1 */}
          <div className="h-[16px] w-16 rounded-full shimmer ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full min-h-[72px] items-center gap-3 border-b border-bg-tertiary px-4 py-4 transition-colors hover:bg-bg-tertiary active:bg-bg-quaternary last:border-b-0"
      type="button"
    >
      {/* Coin Icon */}
      <div className="relative h-10 w-10 flex-shrink-0">
        <Image
          src={tokenIcon}
          alt={`${token.name} icon`}
          width={40}
          height={40}
          className="rounded-full"
          onError={(e) => {
            // Fallback to default icon if image fails to load
            e.currentTarget.src = getTokenIcon('default');
          }}
        />
      </div>

      {/* Coin Info */}
      <div className="flex-1 text-left">
        <div className="font-semibold text-base leading-tight text-text-primary">
          {token.name}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-text-secondary">
            {formatCrypto(availableBalance, token.symbol)} {token.symbol}
          </span>
          {hasLockedBalance && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-warning/10 text-warning text-xs rounded">
              <Lock className="h-3 w-3" />
              {formatCrypto(lockedBalance, token.symbol)}
            </span>
          )}
          {networkCount > 1 && (
            <span className="text-xs text-muted-foreground">
              • {networkCount} networks
            </span>
          )}
        </div>
      </div>

      {/* Visibility Toggle */}
      {/* {onToggleVisibility && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(token.id, !isVisible);
          }}
          className="mr-2 rounded-full p-2 text-text-tertiary transition-colors hover:bg-bg-quaternary hover:text-text-secondary"
          aria-label={isVisible ? "Hide token" : "Show token"}
        >
          {isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      )} */}

      {/* Value & Change */}
      <div className="text-right">
        {!price || priceError ? (
          <>
            <div className="font-semibold text-base leading-tight text-text-secondary">
              Price unavailable
            </div>
            <div className="mt-1 text-xs text-text-tertiary">Tap to retry</div>
          </>
        ) : (
          <>
            <div className="font-semibold text-base leading-tight text-text-primary">
              {formatUSD(usdValue)}
            </div>
            {priceChange !== 0 && (
              <div className={`mt-1 text-xs font-semibold ${changeColor}`}>
                {priceChange > 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

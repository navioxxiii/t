"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, Info, Loader2, AlertCircle, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBalances } from "@/hooks/useBalances";
import { useCoinPrices } from "@/hooks/useCoinPrices";
import { useSwap, useSwapEstimate } from "@/hooks/useSwap";
import { SWAP_FEE_PERCENTAGE, MINIMUM_SWAP_USD } from "@/lib/binance/swap";
import Image from "next/image";
import { formatCrypto, formatUSD } from "@/lib/utils/currency";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { haptics } from "@/lib/utils/haptics";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import type { UserBalance } from "@/types/balance";

export default function SwapClient() {
  const searchParams = useSearchParams();
  const { data: balances } = useBalances();
  const symbols = balances?.map((b) => b.token.symbol) ?? [];
  const { data: pricesMap } = useCoinPrices(symbols);

  // Use lazy initialization to set initial fromCoin based on URL parameter
  const [fromCoin, setFromCoin] = useState<string>(() => {
    // Initialize directly with URL param
    const fromParam = searchParams.get("from") || "";
    return fromParam;
  });
  const [toCoin, setToCoin] = useState<string>("");
  const [fromAmount, setFromAmount] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Validate and clear invalid fromCoin when balances load
  useEffect(() => {
    if (fromCoin && balances) {
      const isValid = balances.some((b) => b.token.symbol === fromCoin);
      if (!isValid) {
        setFromCoin(""); // Clear invalid selection
      }
    }
  }, [fromCoin, balances]);

  const fromBalance = balances?.find((b) => b.token.symbol === fromCoin);
  const toBalance = balances?.find((b) => b.token.symbol === toCoin);
  const fromPrice = pricesMap?.get(fromCoin);

  // Helper function to sort balances by USD value
  const sortBalancesByUsdValue = (balances: UserBalance[]) => {
    return [...balances].sort((a, b) => {
      const aPrice = pricesMap?.get(a.token.symbol);
      const bPrice = pricesMap?.get(b.token.symbol);
      const aValue = aPrice ? parseFloat(a.balance) * aPrice.current_price : 0;
      const bValue = bPrice ? parseFloat(b.balance) * bPrice.current_price : 0;
      return bValue - aValue;
    });
  };

  // Helper function to sort balances alphabetically
  const sortBalancesAlphabetically = (balances: UserBalance[]) => {
    return [...balances].sort((a, b) => a.token.symbol.localeCompare(b.token.symbol));
  };

  // Sort balances for dropdowns
  // "From" dropdown: Sort by USD value (highest balance first)
  // "To" dropdown: Sort alphabetically (easier to find target coin)
  const fromBalancesSorted = useMemo(() => {
    if (!balances) return [];
    return sortBalancesByUsdValue(balances);
  }, [balances, pricesMap]);

  const toBalancesSorted = useMemo(() => {
    if (!balances) return [];
    return sortBalancesAlphabetically(balances);
  }, [balances]);

  // Get real-time swap estimate
  const parsedAmount = fromAmount ? parseFloat(fromAmount) : undefined;
  const {
    data: estimate,
    isLoading: estimateLoading,
    refetch,
  } = useSwapEstimate(fromCoin || undefined, toCoin || undefined, parsedAmount);

  // Swap mutation
  const swapMutation = useSwap();

  const handleSwapCoins = () => {
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
    setFromAmount("");
  };

  const fromUsdValue =
    fromAmount && fromPrice
      ? parseFloat(fromAmount) * fromPrice.current_price
      : 0;

  const handleMaxAmount = () => {
    if (!fromBalance) return;
    // Use available balance (not total balance)
    const available = parseFloat(fromBalance.available_balance);
    setFromAmount(available.toString());
  };

  const handleReviewSwap = async () => {
    // Client-side check: prevent swapping same base token
    if (fromBalance && toBalance && fromBalance.token.id === toBalance.token.id) {
      toast.error('Cannot swap same token across different networks');
      return;
    }

    // Force fresh estimate before confirming
    await refetch();
    setShowConfirmDialog(true);
  };

  const handleConfirmSwap = async () => {
    if (!fromCoin || !toCoin || !parsedAmount || !estimate) return;

    // Double-check same token validation
    if (fromBalance && toBalance && fromBalance.token.id === toBalance.token.id) {
      toast.error('Cannot swap same token across different networks');
      return;
    }

    try {
      await swapMutation.mutateAsync({
        fromCoin,
        toCoin,
        fromAmount: parsedAmount,
        estimate,
      });

      toast.success("Swap completed successfully!");
      setShowConfirmDialog(false);
      setFromAmount("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Swap failed";
      toast.error(errorMessage);
    }
  };

  // Validation
  const insufficientBalance =
    fromBalance && parsedAmount
      ? parsedAmount > parseFloat(fromBalance.available_balance)
      : false;

  const sameTokenSwap = fromBalance && toBalance && fromBalance.token.id === toBalance.token.id;
  const belowMinimum = fromUsdValue > 0 && fromUsdValue < MINIMUM_SWAP_USD;

  const isSwapDisabled =
    !fromCoin ||
    !toCoin ||
    !fromAmount ||
    parsedAmount === undefined ||
    parsedAmount <= 0 ||
    insufficientBalance ||
    sameTokenSwap ||
    belowMinimum ||
    !estimate;

  return (
    <div className="mx-auto max-w-lg px-4 pt-8">
      <Card className="p-6 space-y-1 bg-bg-secondary border-bg-tertiary">
        {/* From Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">From</span>
            {fromBalance && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-tertiary">
                    Available:{" "}
                    {formatCrypto(parseFloat(fromBalance.available_balance), fromCoin)}
                  </span>
                  {parseFloat(fromBalance.locked_balance) > 0 && (
                    <span className="text-warning flex items-center gap-0.5" title={`${formatCrypto(parseFloat(fromBalance.locked_balance), fromCoin)} locked`}>
                      <Lock className="h-3 w-3" />
                      {formatCrypto(parseFloat(fromBalance.locked_balance), fromCoin)}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-semibold text-brand-primary hover:text-brand-primary-light hover:bg-brand-primary/10"
                  onClick={handleMaxAmount}
                >
                  MAX
                </Button>
              </div>
            )}
          </div>
          {/* Pill Container */}
          <div className="flex rounded-2xl bg-bg-tertiary border border-bg-tertiary overflow-hidden h-16 items-center">
            {/* Coin Selector */}
            <Select value={fromCoin} onValueChange={setFromCoin}>
              <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-bg-secondary/50 h-full rounded-l-2xl rounded-r-none border-r border-border/50 py-0">
                <SelectValue placeholder="Select">
                  {fromBalance && (
                    <div className="flex items-center gap-2">
                      <Image
                        src={fromBalance?.token.logo_url ?? '/icons/crypto/default.svg'}
                        alt={fromBalance?.token.name ?? fromCoin}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="font-semibold">{fromCoin}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fromBalancesSorted.map((balance) => (
                  <SelectItem
                    key={balance.token.id}
                    value={balance.token.symbol}
                    disabled={balance.token.symbol === toCoin}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={balance.token.logo_url ?? '/icons/crypto/default.svg'}
                        alt={balance.token.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{balance.token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Amount Input */}
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 border-0 bg-transparent text-right text-xl font-semibold h-full rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          {fromUsdValue > 0 && (
            <div className="text-right text-xs text-text-tertiary px-1">
              {formatUSD(fromUsdValue)}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapCoins}
            disabled={!fromCoin || !toCoin}
            className="rounded-full h-10 w-10 bg-bg-primary border-2 border-bg-tertiary shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 hover:rotate-180 disabled:hover:scale-100 disabled:hover:rotate-0"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">To</span>
            {toBalance && (
              <span className="text-text-tertiary">
                Balance: {formatCrypto(parseFloat(toBalance.balance), toCoin)}
              </span>
            )}
          </div>
          {/* Pill Container */}
          <div className="flex items-center rounded-2xl bg-bg-tertiary border border-bg-tertiary overflow-hidden h-16">
            {/* Coin Selector */}
            <Select value={toCoin} onValueChange={setToCoin}>
              <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-bg-secondary/50 h-full rounded-l-2xl rounded-r-none border-r border-border/50 py-0">
                <SelectValue placeholder="Select">
                  {toBalance && (
                    <div className="flex items-center gap-2">
                      <Image
                        src={toBalance?.token.logo_url ?? '/icons/crypto/default.svg'}
                        alt={toBalance?.token.name ?? toCoin}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="font-semibold">{toCoin}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {toBalancesSorted.map((balance) => (
                  <SelectItem
                    key={balance.token.id}
                    value={balance.token.symbol}
                    disabled={balance.token.symbol === fromCoin}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={balance.token.logo_url ?? '/icons/crypto/default.svg'}
                        alt={balance.token.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{balance.token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Amount Display */}
            <div className="flex-1 flex items-center justify-end px-4 text-xl font-semibold text-text-primary">
              {estimateLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : estimate && isFinite(estimate.toAmount) && estimate.toAmount > 0 ? (
                estimate.toAmount.toFixed(8)
              ) : fromAmount && parsedAmount && parsedAmount > 0 && fromCoin && toCoin ? (
                <span className="text-action-red text-sm">Error</span>
              ) : (
                <span className="text-text-tertiary">0.00000000</span>
              )}
            </div>
          </div>
          {estimate && (
            <div className="text-right text-xs text-text-tertiary px-1">
              {formatUSD(estimate.toAmount * estimate.toPrice)}
            </div>
          )}
        </div>
      </Card>

      {/* Validation Errors */}
      {sameTokenSwap && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cannot swap same token across different networks. Please select different tokens.
          </AlertDescription>
        </Alert>
      )}

      {insufficientBalance && !sameTokenSwap && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Insufficient available balance. You have{" "}
            {formatCrypto(parseFloat(fromBalance?.available_balance || "0"), fromCoin)}{" "}
            {fromCoin} available
            {fromBalance && parseFloat(fromBalance.locked_balance || "0") > 0 && (
              <span className="block mt-1 text-xs">
                ({formatCrypto(parseFloat(fromBalance.locked_balance), fromCoin)} locked in pending transactions)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {belowMinimum && !insufficientBalance && !sameTokenSwap && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Minimum swap amount is ${MINIMUM_SWAP_USD} USD
          </AlertDescription>
        </Alert>
      )}

      {/* Swap Details Card */}
      {estimate && !insufficientBalance && !belowMinimum && !sameTokenSwap && (
        <Card className="mt-4 p-5 border shadow-sm">
          <div className="space-y-4">
            {/* Exchange Rate */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium font-mono">
                1 {fromCoin} ≈ {estimate.rate.toFixed(8)} {toCoin}
              </span>
            </div>

            {/* Network Fee */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Fee ({SWAP_FEE_PERCENTAGE}%)
              </span>
              <span className="font-medium">
                {formatUSD(estimate.feeAmount)}
              </span>
            </div>

            {/* Priority Indicator */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Speed</span>

              {estimate.isHighPriority ? (
                <Badge variant="success" className="gap-1.5">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  High Priority
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-2 font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Normal
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Info Card */}
      {/* <Card className="mt-4 p-4 bg-muted/50">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Instant Swap</p>
              <p>
                Swaps are executed instantly within your wallet. A {SWAP_FEE_PERCENTAGE}% fee
                applies. Minimum swap amount is ${MINIMUM_SWAP_USD} USD.
              </p>
            </div>
          </div>
        </Card> */}

      {/* Swap Button */}
      <Button
        className="w-full mt-6 h-12 text-base font-semibold"
        disabled={isSwapDisabled || swapMutation.isPending}
        onClick={handleReviewSwap}
      >
        {swapMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : !fromCoin || !toCoin ? (
          "Select coins to swap"
        ) : sameTokenSwap ? (
          "Cannot swap same token"
        ) : !fromAmount || parsedAmount === undefined || parsedAmount <= 0 ? (
          "Enter an amount"
        ) : insufficientBalance ? (
          "Insufficient balance"
        ) : belowMinimum ? (
          `Minimum ${formatUSD(MINIMUM_SWAP_USD)}`
        ) : !estimate ? (
          "Calculating..."
        ) : (
          "Review Swap"
        )}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Swap</DialogTitle>
            <DialogDescription>
              Review the swap details before confirming
            </DialogDescription>
          </DialogHeader>

          {estimate && (
            <div className="space-y-4 py-4">
              {/* From */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You pay</span>
                <div className="flex items-center gap-2">
                  <Image
                    src={fromBalance?.token.logo_url ?? '/icons/crypto/default.svg'}
                    alt={fromBalance?.token.name ?? fromCoin}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="font-semibold">
                    {estimate.fromAmount} {fromCoin}
                  </span>
                </div>
              </div>

              {/* To */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  You receive
                </span>
                <div className="flex items-center gap-2">
                  <Image
                    src={toBalance?.token.logo_url ?? '/icons/crypto/default.svg'}
                    alt={toBalance?.token.name ?? toCoin}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="font-semibold">
                    {estimate.toAmount.toFixed(8)} {toCoin}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span>
                    1 {fromCoin} = {estimate.rate.toFixed(8)} {toCoin}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Fee ({SWAP_FEE_PERCENTAGE}%)
                  </span>
                  <span>{formatUSD(estimate.feeAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={swapMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSwap}
              disabled={swapMutation.isPending}
            >
              {swapMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Swap"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

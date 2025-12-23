"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  RefreshCw,
  LineChart,
  Lock,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCrypto, formatUSD, shortenAddress } from "@/lib/utils/currency";
import { CoinTransactionList } from "./CoinTransactionList";
import { useBalances } from "@/hooks/useBalances";
import { useCoinPrice } from "@/hooks/useCoinPrices";
import { useCoinChart, TimePeriod } from "@/hooks/useCoinChart";
import { CoinChart } from "@/components/charts/CoinChart";
import { Skeleton } from "@/components/ui/skeleton";
import { SendDrawer } from "@/components/send/SendDrawer";
import { ReceiveDrawer } from "@/components/receive/ReceiveDrawer";
import Image from "next/image";
import QRCode from "react-qr-code";
import type { UserBalance } from "@/types/balance";

interface CoinDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialBaseTokenId?: number;
}

export function CoinDetailDrawer({
  isOpen,
  onClose,
  initialBaseTokenId,
}: CoinDetailDrawerProps) {
  const [selectedTokenId, setSelectedTokenId] = useState(initialBaseTokenId || 0);
  const [copiedAddresses, setCopiedAddresses] = useState<
    Record<string, boolean>
  >({});
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [showChart, setShowChart] = useState(true);
  const [receiveDrawerOpen, setReceiveDrawerOpen] = useState(false);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);

  const router = useRouter();

  // Debug: Log render state
  // console.log('[CoinDetailDrawer] Render:', {
  //   isOpen,
  //   initialBaseTokenId,
  //   selectedTokenId,
  // });

  const { data: balances, isLoading: balancesLoading } = useBalances();

  // Find the selected balance by token ID
  const balance = useMemo(
    () => balances?.find((b) => b.token.id === selectedTokenId),
    [balances, selectedTokenId]
  );

  // Extract symbol from balance for hooks that need it
  const symbol = balance?.token.symbol || "";
  const isStablecoin = balance?.token.is_stablecoin ?? false;

  const {
    data: coinPrice,
    isLoading: priceLoading,
    isError: priceError,
    refetch: refetchPrice,
  } = useCoinPrice(symbol);

  // Fetch chart data only for non-stablecoins (useCoinChart handles DB lookup)
  // Disable query when drawer is closed to prevent unnecessary background polling
  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchChart
  } = useCoinChart(
    isStablecoin ? "" : symbol,
    timePeriod,
    isOpen
  );

  // Debug: Log chart data
  // console.log('[CoinDetailDrawer] Chart data:', {
  //   symbol,
  //   timePeriod,
  //   chartData,
  //   chartLoading,
  //   chartDataLength: chartData?.length,
  //   hasChartData: chartData && chartData.length > 0,
  // });

  // Update selected token ID when initial ID changes
  if (initialBaseTokenId && selectedTokenId !== initialBaseTokenId) {
    // console.log("[CoinDetailDrawer] Updating selectedTokenId:", {
    //   from: selectedTokenId,
    //   to: initialBaseTokenId,
    // });
    setSelectedTokenId(initialBaseTokenId);
  }

  const handleCopyAddress = async (address: string, networkCode: string) => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddresses((prev) => ({ ...prev, [networkCode]: true }));
      setTimeout(() => {
        setCopiedAddresses((prev) => ({ ...prev, [networkCode]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Calculate balance values
  const totalBalance = balance ? parseFloat(balance.balance) : 0;
  const lockedBalance = balance ? parseFloat(balance.locked_balance) : 0;
  const availableBalance = balance ? parseFloat(balance.available_balance) : 0;

  const usdValue = coinPrice ? totalBalance * coinPrice.current_price : 0;
  const currentPrice = coinPrice?.current_price ?? 0;
  const priceChange = coinPrice?.price_change_percentage_24h ?? 0;

  const iconPath = balance?.token.logo_url ?? '/icons/crypto/default.svg';

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh] md:max-h-screen">
          {/* Header */}
          <DrawerHeader className="border-b border-bg-tertiary bg-bg-secondary">
            <div className="flex items-center justify-between mx-auto max-w-4xl w-full ">
              <DrawerTitle className="text-lg font-semibold text-text-primary">
                Coin Details
              </DrawerTitle>
              <div className="flex items-center gap-2">
                {!isStablecoin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowChart(!showChart)}
                    className={
                      showChart ? "text-brand-primary" : "text-text-secondary"
                    }
                    title={showChart ? "Hide chart" : "Show chart"}
                  >
                    <LineChart className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Coin Selector */}
            <div className="mx-auto max-w-2xl">
              <Select value={selectedTokenId.toString()} onValueChange={(val) => setSelectedTokenId(parseInt(val))}>
                <SelectTrigger className="w-full h-12 text-base border-bg-tertiary bg-bg-secondary">
                  <SelectValue placeholder="Select a coin">
                    {balance && (
                      <div className="flex items-center gap-3">
                        <Image
                          src={iconPath}
                          alt={balance.token.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="font-semibold text-text-primary">
                          {balance.token.name}
                        </span>
                        <span className="text-text-secondary">
                          ({balance.token.symbol})
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {balances?.map((b) => (
                    <SelectItem key={b.token.id} value={b.token.id.toString()}>
                      <div className="flex items-center gap-3">
                        <Image
                          src={b.token.logo_url ?? '/icons/crypto/default.svg'}
                          alt={b.token.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <span>{b.token.name}</span>
                        <span className="text-text-secondary">
                          ({b.token.symbol})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Price */}
            <div className="mx-auto max-w-2xl text-center">
              {priceLoading ? (
                <>
                  <Skeleton className="h-9 w-32 mx-auto shimmer" />
                  <Skeleton className="h-5 w-24 mx-auto mt-1 shimmer" />
                </>
              ) : !coinPrice || priceError ? (
                <>
                  <p className="text-2xl font-semibold text-text-secondary mb-2">
                    Price unavailable
                  </p>
                  <p className="text-sm text-text-tertiary mb-4">
                    Unable to fetch current price. The API may be temporarily
                    unavailable.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPrice()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatUSD(currentPrice, { isPrice: true })}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      priceChange > 0
                        ? "text-action-green"
                        : priceChange < 0
                          ? "text-action-red"
                          : "text-text-secondary"
                    }`}
                  >
                    {priceChange > 0 ? "+" : ""}
                    {priceChange.toFixed(2)}% (24h)
                  </p>
                </>
              )}
            </div>

            {/* Price Chart */}
            {!isStablecoin && showChart && (
              <div className="mx-auto max-w-2xl">
                {/* Chart with embedded controls */}
                <CoinChart
                  data={chartData || []}
                  height={280}
                  timePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                  isLoading={chartLoading}
                  error={chartError instanceof Error ? chartError.message : null}
                  onRetry={() => refetchChart()}
                />
              </div>
            )}

            {/* Balance Details Card */}
            <div className="mx-auto max-w-2xl rounded-lg border border-bg-tertiary bg-bg-secondary p-6">
              {balancesLoading || !balance ? (
                <div className="space-y-4">
                  {/* Balance Skeleton */}
                  <div className="text-center">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-5 w-24 mx-auto mt-1" />
                  </div>
                  {/* Networks Skeleton */}
                  <div className="pt-4 border-t border-border">
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Balance */}
                  <div className="text-center">
                    {priceLoading ? (
                      <>
                        <Skeleton className="h-8 w-48 mx-auto shimmer" />
                        <Skeleton className="h-5 w-24 mx-auto mt-1 shimmer" />
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-text-primary">
                          {formatCrypto(totalBalance, symbol)}{" "}
                          {symbol.toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {!coinPrice || priceError
                            ? "Value unavailable"
                            : formatUSD(usdValue)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Balance Breakdown */}
                  {lockedBalance > 0 && (
                    <Card className="p-4 bg-bg-tertiary/50">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Available</span>
                          <span className="font-semibold text-action-green">
                            {formatCrypto(availableBalance, symbol)}{" "}
                            {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                          <span className="font-semibold text-warning">
                            {formatCrypto(lockedBalance, symbol)}{" "}
                            {symbol}
                          </span>
                        </div>
                        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-action-green"
                            style={{
                              width: `${(availableBalance / totalBalance) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Network Addresses */}
                  {balance.deposit_addresses.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-text-secondary mb-3">
                        Deposit Addresses ({balance.deposit_addresses.length}{" "}
                        {balance.deposit_addresses.length === 1
                          ? "network"
                          : "networks"}
                        )
                      </p>
                      <Accordion
                        type="single"
                        collapsible
                        className="space-y-2"
                      >
                        {balance.deposit_addresses.map((addr) => {
                          const isCopied = copiedAddresses[addr.network.code];
                          return (
                            <AccordionItem
                              key={addr.id}
                              value={addr.network.code}
                              className="border border-bg-tertiary rounded-lg overflow-hidden bg-bg-tertiary/30"
                            >
                              <AccordionTrigger className="px-3 py-2 hover:bg-bg-tertiary/50 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={addr.network.logo_url}
                                    alt={addr.network.name}
                                    width={20}
                                    height={20}
                                    className="rounded-full"
                                  />
                                  <span className="text-sm font-medium">
                                    {/* {addr.network.display_name} */}
                                    {symbol.toUpperCase()}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {addr.deployment.token_standard}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3 space-y-3">
                                {/* QR Code */}
                                <div className="flex justify-center py-2">
                                  <div className="p-2 bg-white rounded-lg">
                                    <QRCode
                                      value={addr.address}
                                      size={120}
                                      level="M"
                                    />
                                  </div>
                                </div>

                                {/* Address with Copy Button */}
                                <button
                                  onClick={() =>
                                    handleCopyAddress(
                                      addr.address,
                                      addr.network.code
                                    )
                                  }
                                  className={`group relative w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 font-mono text-xs transition-all ${
                                    isCopied
                                      ? "bg-action-green/10 border border-action-green/30"
                                      : "bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50"
                                  }`}
                                  title={isCopied ? "Copied!" : "Click to copy"}
                                >
                                  <span
                                    className={`flex-1 text-left truncate ${isCopied ? "text-action-green" : "text-text-primary"}`}
                                  >
                                    {shortenAddress(addr.address, 8, 8)}
                                  </span>
                                  <div className="shrink-0">
                                    {isCopied ? (
                                      <Check className="h-3 w-3 text-action-green" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-text-secondary group-hover:text-brand-primary transition-colors" />
                                    )}
                                  </div>
                                </button>

                                {/* Network Info */}
                                {addr.deployment.contract_address && (
                                  <div className="text-xs text-text-tertiary">
                                    <span className="font-medium">
                                      Contract:
                                    </span>{" "}
                                    <span className="font-mono">
                                      {shortenAddress(
                                        addr.deployment.contract_address,
                                        6,
                                        4
                                      )}
                                    </span>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mx-auto max-w-2xl">
              <div className="grid grid-cols-3 gap-3">
                {/* Send Button */}
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-1.5 py-3"
                  onClick={() => setSendDrawerOpen(true)}
                  disabled={!balance || availableBalance <= 0}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-semibold">Send</span>
                </Button>

                {/* Receive Button */}
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-1.5 py-3"
                  onClick={() => setReceiveDrawerOpen(true)}
                  disabled={!balance}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  <span className="text-xs font-semibold">Receive</span>
                </Button>

                {/* Swap Button */}
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-1.5 py-3"
                  onClick={() => {
                    onClose();
                    router.push(`/swap?from=${symbol}`);
                  }}
                  disabled={!balance}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="text-xs font-semibold">Swap</span>
                </Button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="mx-auto max-w-2xl">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">
                Transaction History
              </h3>
              {balance && (
                <CoinTransactionList
                  baseTokenId={balance.token.id}
                  coinPrice={coinPrice?.current_price}
                />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Send Drawer */}
      {balance && (
        <SendDrawer
          balance={balance}
          open={sendDrawerOpen}
          onOpenChange={setSendDrawerOpen}
        />
      )}

      {/* Receive Drawer */}
      {balance && (
        <ReceiveDrawer
          open={receiveDrawerOpen}
          onOpenChange={setReceiveDrawerOpen}
          balance={balance}
        />
      )}
    </>
  );
}

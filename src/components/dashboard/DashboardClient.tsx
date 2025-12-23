'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BalanceHeader } from '@/components/dashboard/BalanceHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CoinList } from '@/components/dashboard/CoinList';
import { CoinDetailDrawer } from '@/components/dashboard/CoinDetailDrawer';
import { CoinSelectorDrawer } from '@/components/dashboard/CoinSelectorDrawer';
import { SendDrawer } from '@/components/send/SendDrawer';
import { ReceiveDrawer } from '@/components/receive/ReceiveDrawer';
import { PinSetupDialog } from '@/components/security/PinSetupDialog';
import { useBalances } from '@/hooks/useBalances';
import { useCoinPrices } from '@/hooks/useCoinPrices';
import { calculatePortfolioValue, calculatePortfolioChange } from '@/lib/binance/client';

export default function DashboardClient() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hasPinSetup = useAuthStore((state) => state.hasPinSetup);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  // Coin detail drawer state
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick actions state
  const [sendSelectorOpen, setSendSelectorOpen] = useState(false);
  const [receiveSelectorOpen, setReceiveSelectorOpen] = useState(false);
  const [selectedSendTokenId, setSelectedSendTokenId] = useState<number | null>(null);
  const [selectedReceiveTokenId, setSelectedReceiveTokenId] = useState<number | null>(null);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [receiveDrawerOpen, setReceiveDrawerOpen] = useState(false);

  // PIN setup state - only show after auth completes and no PIN
  const shouldShowPinSetup = !loading && !!user && !hasPinSetup;
  const [showPinSetup, setShowPinSetup] = useState(false);

  // Update PIN setup visibility when auth state changes
  useEffect(() => {
    if (shouldShowPinSetup) {
      setShowPinSetup(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowPinSetup]);

  // Fetch balances and prices
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const symbols = balances?.map((b) => b.token.symbol) ?? [];
  const { data: pricesMap, isLoading: pricesLoading, isError: pricesError } = useCoinPrices(symbols);

  // Calculate total portfolio value
  const { totalValue, change24h, changePercentage } = useMemo(() => {
    if (!balances || !pricesMap) {
      return { totalValue: 0, change24h: 0, changePercentage: 0 };
    }

    // Create balance map
    const balanceMap = new Map<string, number>();
    balances.forEach((balance) => {
      balanceMap.set(balance.token.symbol, parseFloat(balance.balance));
    });

    // Calculate values
    const totalValue = calculatePortfolioValue(balanceMap, pricesMap);
    const { change, changePercentage } = calculatePortfolioChange(balanceMap, pricesMap);

    return { totalValue, change24h: change, changePercentage };
  }, [balances, pricesMap]);

  const handleCoinClick = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Quick action handlers
  const handleSendClick = () => {
    setSendSelectorOpen(true);
  };

  const handleReceiveClick = () => {
    setReceiveSelectorOpen(true);
  };

  const handleSwapClick = () => {
    router.push('/swap');
  };

  const handleSendCoinSelected = (tokenId: number) => {
    setSelectedSendTokenId(tokenId);
    setSendSelectorOpen(false);
    setSendDrawerOpen(true);
  };

  const handleReceiveCoinSelected = (tokenId: number) => {
    setSelectedReceiveTokenId(tokenId);
    setReceiveSelectorOpen(false);
    setReceiveDrawerOpen(true);
  };

  const handleSendDrawerClose = (open: boolean) => {
    setSendDrawerOpen(open);
    if (!open) {
      // Reset selected coin when drawer closes
      setSelectedSendTokenId(null);
    }
  };

  // Get selected balance data
  const selectedSendBalance = balances?.find(b => b.token.id === selectedSendTokenId);
  const selectedReceiveBalance = balances?.find(b => b.token.id === selectedReceiveTokenId);

  const isLoading = balancesLoading || pricesLoading;

  return (
    <>
      {/* Total Balance Section */}
      <BalanceHeader
        totalBalance={totalValue}
        isLoading={isLoading}
        change24h={change24h}
        changePercentage={changePercentage}
      />

      {/* Quick Actions */}
      <QuickActions
        onSend={handleSendClick}
        onReceive={handleReceiveClick}
        onSwap={handleSwapClick}
      />

      {/* Coin List */}
      <div className="mt-6">
        <CoinList
          onCoinClick={handleCoinClick}
          pricesMap={pricesMap}
          pricesLoading={pricesLoading}
          pricesError={pricesError}
        />
      </div>

      {/* Coin Detail Drawer */}
      <CoinDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        initialBaseTokenId={selectedTokenId ?? undefined}
      />

      {/* Send Flow Drawers */}
      <CoinSelectorDrawer
        open={sendSelectorOpen}
        onOpenChange={setSendSelectorOpen}
        onSelectCoin={handleSendCoinSelected}
        title="Select Coin to Send"
        description="Choose which cryptocurrency to send"
        pricesMap={pricesMap}
        pricesLoading={pricesLoading}
      />

      {/* Send Drawer - controlled mode */}
      {selectedSendBalance && (
        <SendDrawer
          open={sendDrawerOpen}
          onOpenChange={handleSendDrawerClose}
          balance={selectedSendBalance}
        />
      )}

      {/* Receive Flow Drawers */}
      <CoinSelectorDrawer
        open={receiveSelectorOpen}
        onOpenChange={setReceiveSelectorOpen}
        onSelectCoin={handleReceiveCoinSelected}
        title="Select Coin to Receive"
        description="Choose which cryptocurrency to receive"
        pricesMap={pricesMap}
        pricesLoading={pricesLoading}
      />

      {selectedReceiveBalance && (
        <ReceiveDrawer
          open={receiveDrawerOpen}
          onOpenChange={setReceiveDrawerOpen}
          balance={selectedReceiveBalance}
        />
      )}

      {/* PIN Setup Dialog - shown on first login */}
      <PinSetupDialog
        open={showPinSetup}
        onSuccess={() => {
          setShowPinSetup(false);
          refreshProfile();
        }}
      />
    </>
  );
}

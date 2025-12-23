/**
 * Transaction List Component
 * Displays transaction history with infinite scroll and date grouping
 */

'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteTransactions, type Transaction } from '@/hooks/useTransactions';
import { TransactionItem } from './TransactionItem';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Clock, XCircle } from 'lucide-react';
import { isToday, isYesterday, isWithinInterval, subDays, format, startOfMonth } from 'date-fns';

interface TransactionListProps {
  baseTokenId?: number;
  limit?: number;
}

// Date grouping helper
function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { label: string; transactions: Transaction[] }[] = [];
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const todayTxs: Transaction[] = [];
  const yesterdayTxs: Transaction[] = [];
  const last7DaysTxs: Transaction[] = [];
  const last30DaysTxs: Transaction[] = [];
  const olderTxsByMonth: Map<string, Transaction[]> = new Map();

  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at);

    if (isToday(txDate)) {
      todayTxs.push(tx);
    } else if (isYesterday(txDate)) {
      yesterdayTxs.push(tx);
    } else if (isWithinInterval(txDate, { start: sevenDaysAgo, end: now })) {
      last7DaysTxs.push(tx);
    } else if (isWithinInterval(txDate, { start: thirtyDaysAgo, end: now })) {
      last30DaysTxs.push(tx);
    } else {
      const monthKey = format(startOfMonth(txDate), 'MMMM yyyy');
      const monthTxs = olderTxsByMonth.get(monthKey) || [];
      monthTxs.push(tx);
      olderTxsByMonth.set(monthKey, monthTxs);
    }
  });

  if (todayTxs.length > 0) groups.push({ label: 'Today', transactions: todayTxs });
  if (yesterdayTxs.length > 0) groups.push({ label: 'Yesterday', transactions: yesterdayTxs });
  if (last7DaysTxs.length > 0) groups.push({ label: 'Last 7 Days', transactions: last7DaysTxs });
  if (last30DaysTxs.length > 0) groups.push({ label: 'Last 30 Days', transactions: last30DaysTxs });

  // Add older transactions by month
  const sortedMonths = Array.from(olderTxsByMonth.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });
  sortedMonths.forEach((monthKey) => {
    groups.push({ label: monthKey, transactions: olderTxsByMonth.get(monthKey)! });
  });

  return groups;
}

export function TransactionList({ baseTokenId, limit = 20 }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteTransactions({ base_token_id: baseTokenId }, limit);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({ threshold: 0 });

  // Fetch next page when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into a single array
  const transactions = data?.pages.flatMap((page) => page.transactions) ?? [];

  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(transactions);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Failed to load transactions
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No transactions yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Grouped Transaction Lists */}
        {groupedTransactions.map((group) => (
          <div key={group.label}>
            {/* Date Header */}
            <h3 className="text-xs font-semibold uppercase text-text-secondary mb-3 px-1">
              {group.label}
            </h3>

            {/* Transaction Items */}
            <div className="space-y-2">
              {group.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => handleTransactionClick(transaction)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Loading indicator / trigger for next page */}
        {hasNextPage && (
          <div ref={ref} className="py-4">
            {isFetchingNextPage ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Scroll to load more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </>
  );
}

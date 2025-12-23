/**
 * Admin Transactions Monitoring Page
 * View and monitor all transactions across all users
 */

'use client';

import { DataTable } from '@/components/datatable';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownLeft, Clock, XCircle } from 'lucide-react';
import { useTransactionStats } from '@/hooks/useTransactionStats';

// Transaction type from database
interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: string;
  coin_symbol: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  to_address: string | null;
  from_address: string | null;
  network_fee: string | null;
  created_at: string;
  completed_at: string | null;
}

// Extended transaction with user email (from API join)
interface TransactionWithUser extends Transaction {
  user_email?: string;
}

// Column definitions for transactions table
const columns: ColumnDef<TransactionWithUser>[] = [
  {
    accessorKey: 'user_email',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-xs font-semibold text-brand-primary">
          {row.original.user_email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-text-primary">{row.original.user_email || row.original.user_id.slice(0, 8)}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const isDeposit = row.original.type === 'deposit';
      return (
        <Badge
          className={
            isDeposit
              ? 'bg-action-green/10 text-action-green'
              : 'bg-brand-primary/10 text-brand-primary'
          }
        >
          {isDeposit ? (
            <ArrowDownLeft className="h-3 w-3 mr-1" />
          ) : (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          )}
          {row.original.type === 'withdrawal' ? 'Send' : 'Deposit'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'coin_symbol',
    header: 'Crypto',
    cell: ({ row }) => (
      <span className="font-semibold text-text-primary">{row.original.coin_symbol}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-text-primary">
        {parseFloat(row.original.amount).toFixed(8)} {row.original.coin_symbol}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={
          row.original.status as
            | 'pending'
            | 'confirmed'
            | 'completed'
            | 'failed'
            | 'cancelled'
        }
      />
    ),
  },
  {
    accessorKey: 'tx_hash',
    header: 'TX Hash',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-text-tertiary">
        {row.original.tx_hash
          ? `${row.original.tx_hash.slice(0, 8)}...${row.original.tx_hash.slice(-6)}`
          : '-'}
      </span>
    ),
  },
  {
    accessorKey: 'network_fee',
    header: 'Fee',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {row.original.network_fee
          ? `${parseFloat(row.original.network_fee).toFixed(8)}`
          : '-'}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {new Date(row.original.created_at).toLocaleString()}
      </span>
    ),
  },
];

export default function TransactionsPage() {
  const { data: stats, isLoading } = useTransactionStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Transaction Monitoring</h1>
        <p className="text-text-secondary mt-2">
          Monitor all transactions across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Today&apos;s Transactions
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-2 text-text-primary">
                    {stats?.todayTransactions || 0}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total Volume (24h)
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-2 text-text-primary">
                    ${stats?.todayVolume || '0.00'}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-action-green/10 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-action-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Pending
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-2 text-text-primary">
                    {stats?.pendingTransactions || 0}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-secondary border-bg-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Failed
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-2 text-text-primary">
                    {stats?.failedTransactions || 0}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-action-red/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-action-red" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        fetchUrl="/api/admin/transactions"
        queryKey={['admin-transactions']}
        header="All Transactions"
        searchPlaceholder="Search by user email, TX hash, or address..."
        exportFilename="transactions"
        filters={[
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: 'deposit', label: 'Deposit' },
              { value: 'withdrawal', label: 'Send' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
          },
          {
            key: 'coin',
            label: 'Cryptocurrency',
            options: [
              { value: 'BTC', label: 'Bitcoin (BTC)' },
              { value: 'ETH', label: 'Ethereum (ETH)' },
              { value: 'USDT', label: 'Tether (USDT)' },
              { value: 'DOGE', label: 'Dogecoin (DOGE)' },
              { value: 'TRX', label: 'Tron (TRX)' },
              { value: 'LTC', label: 'Litecoin (LTC)' },
            ],
          },
        ]}
        showDateFilter={true}
        dateFilterLabel="Transaction Date"
        refetchInterval={30000}
      />
    </div>
  );
}

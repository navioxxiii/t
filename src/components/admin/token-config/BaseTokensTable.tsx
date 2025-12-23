/**
 * Base Tokens Table Component
 * Displays and manages base token definitions
 */

'use client';

import { useState } from 'react';
import { DataTable } from '@/components/datatable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateBaseTokenDialog } from './CreateBaseTokenDialog';
import { EditBaseTokenDialog } from './EditBaseTokenDialog';
import { cn } from '@/lib/utils';

interface BaseToken {
  id: number;
  code: string;
  symbol: string;
  name: string;
  token_type: 'native' | 'stablecoin' | 'utility';
  decimals: number;
  is_stablecoin: boolean;
  binance_id: string | null;
  coingecko_id: string | null;
  primary_provider: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

const createColumns = (
  setSelectedToken: (token: BaseToken) => void,
  setEditDialogOpen: (open: boolean) => void
): ColumnDef<BaseToken>[] => [
  {
    accessorKey: 'symbol',
    header: 'Symbol',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.logo_url && (
          <img
            src={row.original.logo_url}
            alt={row.original.symbol}
            className="h-6 w-6 rounded-full"
          />
        )}
        <span className="font-semibold text-text-primary">{row.original.symbol}</span>
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="text-text-secondary">{row.original.name}</span>,
  },
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-text-tertiary">{row.original.code}</span>
    ),
  },
  {
    accessorKey: 'token_type',
    header: 'Type',
    cell: ({ row }) => {
      const typeColors = {
        native: 'bg-brand-primary/10 text-brand-primary',
        stablecoin: 'bg-action-green/10 text-action-green',
        utility: 'bg-bg-tertiary text-text-secondary',
      };

      return (
        <Badge className={typeColors[row.original.token_type]}>
          {row.original.token_type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'decimals',
    header: 'Decimals',
    cell: ({ row }) => <span className="text-text-secondary">{row.original.decimals}</span>,
  },
  {
    accessorKey: 'primary_provider',
    header: 'Price Provider',
    cell: ({ row }) => {
      const token = row.original;
      const hasBinance = !!token.binance_id;
      const hasCoinGecko = !!token.coingecko_id;
      const isPrimaryBinance = token.primary_provider === 'binance_us';
      const isPrimaryCoinGecko = token.primary_provider === 'coingecko';

      if (!hasBinance && !hasCoinGecko) {
        return <span className="text-xs text-text-tertiary">Manual</span>;
      }

      return (
        <div className="flex flex-col gap-1">
          {token.primary_provider && (
            <div className="text-xs font-medium text-text-secondary">
              Primary: {isPrimaryBinance ? 'Binance' : 'CoinGecko'}
            </div>
          )}
          <div className="flex gap-1 flex-wrap">
            {hasBinance && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  isPrimaryBinance && 'border-brand-primary text-brand-primary'
                )}
              >
                Binance
              </Badge>
            )}
            {hasCoinGecko && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  isPrimaryCoinGecko && 'border-brand-primary text-brand-primary'
                )}
              >
                CoinGecko
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
      <Badge className={row.original.is_active ? 'bg-action-green/10 text-action-green' : 'bg-bg-tertiary text-text-tertiary'}>
        {row.original.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSelectedToken(row.original);
              setEditDialogOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement toggle active status
            }}
          >
            {row.original.is_active ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              if (!confirm(`Initialize balance records for all users for ${row.original.symbol}?`)) return;

              try {
                const response = await fetch(`/api/admin/base-tokens/${row.original.id}/initialize-balances`, {
                  method: 'POST',
                });
                const data = await response.json();

                if (response.ok) {
                  toast.success(`Initialized balances for ${data.created} users (${data.skipped} already existed)`);
                } else {
                  toast.error(data.error || 'Failed to initialize balances');
                }
              } catch (error) {
                toast.error('An error occurred');
              }
            }}
          >
            Initialize User Balances
          </DropdownMenuItem>
          <DropdownMenuItem className="text-action-red">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function BaseTokensTable() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<BaseToken | null>(null);

  const columns = createColumns(setSelectedToken, setEditDialogOpen);

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Base Tokens</h2>
          <p className="text-sm text-text-secondary mt-1">
            Define token concepts independent of blockchain networks
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Token
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        fetchUrl="/api/admin/base-tokens"
        queryKey={['admin-base-tokens']}
        header="All Base Tokens"
        searchPlaceholder="Search tokens..."
        filters={[
          {
            key: 'token_type',
            label: 'Type',
            options: [
              { value: 'native', label: 'Native' },
              { value: 'stablecoin', label: 'Stablecoin' },
              { value: 'utility', label: 'Utility' },
            ],
          },
          {
            key: 'is_active',
            label: 'Status',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
        exportFilename="base-tokens"
        refetchInterval={30000}
      />

      {/* Dialogs */}
      <CreateBaseTokenDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditBaseTokenDialog
        token={selectedToken}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}

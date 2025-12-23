/**
 * Admin Earn Vaults Management Page
 * Manage earn vaults, visibility, and settings
 */

'use client';

import { useState } from 'react';
import { DataTable } from '@/components/datatable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { ToggleVisibilityDialog } from '@/components/admin/earn-vaults/ToggleVisibilityDialog';
import { VaultDetailsDialog } from '@/components/admin/earn-vaults/VaultDetailsDialog';
import { CreateVaultDialog } from '@/components/admin/earn-vaults/CreateVaultDialog';
import { EditVaultDialog } from '@/components/admin/earn-vaults/EditVaultDialog';
import { VaultActionsMenu } from '@/components/admin/earn-vaults/VaultActionsMenu';

// Vault type definition
interface Vault {
  id: string;
  title: string;
  subtitle?: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount?: number;
  total_capacity?: number;
  current_filled: number;
  risk_level: 'low' | 'medium' | 'high';
  status: 'active' | 'sold_out' | 'ended';
  created_at: string;
  active_positions?: number;
  total_locked?: number;
}

// Status badge helper
function renderStatusBadge(status: string) {
  const badges = {
    active: { icon: Eye, text: 'Visible', color: 'text-action-green bg-action-green/10' },
    sold_out: { icon: EyeOff, text: 'Sold Out', color: 'text-action-red bg-action-red/10' },
    ended: { icon: EyeOff, text: 'Ended', color: 'text-text-tertiary bg-text-tertiary/10' }
  };

  const badge = badges[status as keyof typeof badges] || badges.ended;
  const Icon = badge.icon;

  return (
    <Badge className={badge.color}>
      <Icon className="h-3 w-3 mr-1" />
      {badge.text}
    </Badge>
  );
}

// Risk level badge helper
function renderRiskBadge(risk: string) {
  const badges = {
    low: { text: 'Low Risk', color: 'text-action-green bg-action-green/10' },
    medium: { text: 'Medium Risk', color: 'text-yellow-500 bg-yellow-500/10' },
    high: { text: 'High Risk', color: 'text-action-red bg-action-red/10' }
  };

  const badge = badges[risk as keyof typeof badges] || badges.low;

  return (
    <Badge className={badge.color}>
      {badge.text}
    </Badge>
  );
}

// Column definitions factory
const createColumns = (
  setSelectedVault: (vault: Vault) => void,
  setDetailsDialogOpen: (open: boolean) => void,
  setVisibilityDialogOpen: (open: boolean) => void,
  setEditDialogOpen: (open: boolean) => void
): ColumnDef<Vault>[] => [
  {
    accessorKey: 'title',
    header: 'Vault',
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="font-semibold text-text-primary">{row.original.title}</div>
        {row.original.subtitle && (
          <div className="text-xs text-text-tertiary mt-0.5">{row.original.subtitle}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'apy_percent',
    header: 'APY',
    cell: ({ row }) => (
      <span className="text-brand-primary font-bold text-lg">
        {row.original.apy_percent}%
      </span>
    ),
  },
  {
    accessorKey: 'duration_months',
    header: 'Duration',
    cell: ({ row }) => (
      <span className="text-text-secondary">
        {row.original.duration_months} {row.original.duration_months === 1 ? 'month' : 'months'}
      </span>
    ),
  },
  {
    accessorKey: 'risk_level',
    header: 'Risk',
    cell: ({ row }) => renderRiskBadge(row.original.risk_level),
  },
  {
    accessorKey: 'status',
    header: 'Visibility',
    cell: ({ row }) => renderStatusBadge(row.original.status),
  },
  {
    accessorKey: 'total_locked',
    header: 'TVL',
    cell: ({ row }) => (
      <div>
        <div className="font-mono text-sm text-text-primary">
          ${parseFloat(row.original.total_locked?.toString() || '0').toLocaleString()}
        </div>
        {row.original.active_positions !== undefined && (
          <div className="text-xs text-text-tertiary">
            {row.original.active_positions} {row.original.active_positions === 1 ? 'position' : 'positions'}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {new Date(row.original.created_at).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <VaultActionsMenu
        vault={row.original}
        onViewDetails={() => {
          setSelectedVault(row.original);
          setDetailsDialogOpen(true);
        }}
        onToggleVisibility={() => {
          setSelectedVault(row.original);
          setVisibilityDialogOpen(true);
        }}
        onEdit={() => {
          setSelectedVault(row.original);
          setEditDialogOpen(true);
        }}
      />
    ),
  },
];

export default function EarnVaultsPage() {
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const columns = createColumns(
    setSelectedVault,
    setDetailsDialogOpen,
    setVisibilityDialogOpen,
    setEditDialogOpen
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Earn Vaults Management</h1>
          <p className="text-text-secondary mt-2">
            Manage investment vaults, visibility, and capacity
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Vault
        </Button>
      </div>

      <DataTable
        columns={columns}
        fetchUrl="/api/admin/earn-vaults"
        queryKey={['admin-earn-vaults']}
        header="All Vaults"
        searchPlaceholder="Search vaults by name..."
        exportFilename="earn-vaults"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Visible (Active)' },
              { value: 'sold_out', label: 'Hidden (Sold Out)' },
              { value: 'ended', label: 'Hidden (Ended)' },
            ],
          },
          {
            key: 'risk',
            label: 'Risk Level',
            options: [
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ],
          },
          {
            key: 'duration',
            label: 'Duration',
            options: [
              { value: '1', label: '1 Month' },
              { value: '3', label: '3 Months' },
              { value: '6', label: '6 Months' },
              { value: '12', label: '12 Months' },
            ],
          },
        ]}
        refetchInterval={30000}
      />

      <VaultDetailsDialog
        vault={selectedVault}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <ToggleVisibilityDialog
        vault={selectedVault}
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
      />

      <CreateVaultDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditVaultDialog
        vault={selectedVault}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}

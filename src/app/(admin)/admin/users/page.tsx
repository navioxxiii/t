/**
 * Admin Users Management Page
 * Manage users, roles, and ban status
 */

'use client';

import { useState } from 'react';
import { DataTable } from '@/components/datatable';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserProfile } from '@/hooks/useAdminUsers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ChangeRoleDialog } from '@/components/admin/ChangeRoleDialog';
import { BanUserDialog } from '@/components/admin/BanUserDialog';
import { UserDetailsDialog } from '@/components/admin/UserDetailsDialog';
import { VerifyEmailDialog } from '@/components/admin/VerifyEmailDialog';
import { ManualKYCApprovalDialog } from '@/components/admin/ManualKYCApprovalDialog';
import { ResetKYCDialog } from '@/components/admin/ResetKYCDialog';

// Column definitions factory for users table
const createColumns = (
  setSelectedUser: (user: UserProfile) => void,
  setDetailsDialogOpen: (open: boolean) => void,
  setRoleDialogOpen: (open: boolean) => void,
  setBanDialogOpen: (open: boolean) => void,
  setVerifyEmailDialogOpen: (open: boolean) => void,
  setManualKYCDialogOpen: (open: boolean) => void,
  setResetKYCDialogOpen: (open: boolean) => void
): ColumnDef<UserProfile>[] => [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-sm font-semibold text-brand-primary">
          {row.original.email.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-text-primary">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="text-text-secondary">
        {row.original.full_name || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const roleColors = {
        user: 'bg-bg-tertiary text-text-primary',
        admin: 'bg-brand-primary/10 text-brand-primary',
        super_admin: 'bg-brand-primary/20 text-brand-primary',
      };

      return (
        <Badge
          className={
            roleColors[row.original.role as keyof typeof roleColors] ||
            roleColors.user
          }
        >
          {row.original.role === 'super_admin' ? 'Super Admin' : row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-text-primary">
        ${parseFloat(row.original.balance?.toString() || '0').toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Registered',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {new Date(row.original.created_at).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: 'last_login_at',
    header: 'Last Login',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {row.original.last_login_at
          ? new Date(row.original.last_login_at).toLocaleDateString()
          : 'Never'}
      </span>
    ),
  },
  {
    accessorKey: 'is_banned',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.original.is_banned ? 'banned' : 'active'} />
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
              setSelectedUser(row.original);
              setDetailsDialogOpen(true);
            }}
          >
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setRoleDialogOpen(true);
            }}
          >
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setBanDialogOpen(true);
            }}
          >
            {row.original.is_banned ? 'Unban User' : 'Ban User'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setVerifyEmailDialogOpen(true);
            }}
          >
            Verify Email
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setManualKYCDialogOpen(true);
            }}
          >
            Manual KYC Approval
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(row.original);
              setResetKYCDialogOpen(true);
            }}
          >
            Reset KYC
          </DropdownMenuItem>
          <DropdownMenuItem>View Transactions</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [verifyEmailDialogOpen, setVerifyEmailDialogOpen] = useState(false);
  const [manualKYCDialogOpen, setManualKYCDialogOpen] = useState(false);
  const [resetKYCDialogOpen, setResetKYCDialogOpen] = useState(false);

  const columns = createColumns(
    setSelectedUser,
    setDetailsDialogOpen,
    setRoleDialogOpen,
    setBanDialogOpen,
    setVerifyEmailDialogOpen,
    setManualKYCDialogOpen,
    setResetKYCDialogOpen
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
        <p className="text-text-secondary mt-2">
          Manage users, roles, and access control
        </p>
      </div>

      <DataTable
        columns={columns}
        fetchUrl="/api/admin/users"
        queryKey={['admin-users']}
        header="All Users"
        searchPlaceholder="Search by email, name, or user ID..."
        exportFilename="users"
        filters={[
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'banned', label: 'Banned' },
            ],
          },
        ]}
        showDateFilter={true}
        dateFilterLabel="Registration Date"
        refetchInterval={30000}
      />

      <UserDetailsDialog
        user={selectedUser}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <ChangeRoleDialog
        user={selectedUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />

      <BanUserDialog
        user={selectedUser}
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
      />

      <VerifyEmailDialog
        user={selectedUser}
        open={verifyEmailDialogOpen}
        onOpenChange={setVerifyEmailDialogOpen}
      />

      <ManualKYCApprovalDialog
        user={selectedUser}
        open={manualKYCDialogOpen}
        onOpenChange={setManualKYCDialogOpen}
      />

      <ResetKYCDialog
        user={selectedUser}
        open={resetKYCDialogOpen}
        onOpenChange={setResetKYCDialogOpen}
      />
    </div>
  );
}

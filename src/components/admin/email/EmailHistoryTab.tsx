/**
 * Email History Tab
 * DataTable listing all sent email records
 */

'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { EmailHistoryDetailDialog } from './EmailHistoryDetailDialog';
import type { EmailHistoryRecord } from '@/hooks/useAdminEmail';

const CATEGORY_BADGE_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
  announcement: 'info',
  product_update: 'success',
  compliance_kyc: 'warning',
  security_alert: 'danger',
  transaction_notice: 'default',
  custom: 'secondary',
};

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  completed: 'success',
  failed: 'danger',
  partial_failed: 'warning',
  sending: 'info',
};

const TYPE_VARIANT: Record<string, 'default' | 'info' | 'warning'> = {
  individual: 'default',
  group: 'info',
  all: 'warning',
};

export function EmailHistoryTab() {
  const [detailRecord, setDetailRecord] = useState<EmailHistoryRecord | null>(null);

  const columns: ColumnDef<EmailHistoryRecord>[] = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="font-medium truncate max-w-[180px] block">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant={CATEGORY_BADGE_VARIANT[row.original.category] || 'default'}>
          {row.original.category.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'recipient_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={TYPE_VARIANT[row.original.recipient_type] || 'default'}>
          {row.original.recipient_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'recipient_count',
      header: 'Recipients',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.recipient_count}</span>
      ),
    },
    {
      id: 'sent_failed',
      header: 'Sent / Failed',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.sent_count}
          {row.original.failed_count > 0 && (
            <span className="text-action-red"> / {row.original.failed_count}</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] || 'default'}>
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      id: 'sent_by_email',
      header: 'Sent By',
      cell: ({ row }) => (
        <span className="text-xs text-text-tertiary">
          {row.original.sent_by_profile?.email || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-text-tertiary">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetailRecord(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        fetchUrl="/api/admin/email/history"
        queryKey={['admin-email-history']}
        searchPlaceholder="Search by subject..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'sending', label: 'Sending' },
              { value: 'completed', label: 'Completed' },
              { value: 'partial_failed', label: 'Partial Failed' },
              { value: 'failed', label: 'Failed' },
            ],
          },
          {
            key: 'category',
            label: 'Category',
            options: [
              { value: 'announcement', label: 'Announcement' },
              { value: 'product_update', label: 'Product Update' },
              { value: 'compliance_kyc', label: 'Compliance / KYC' },
              { value: 'security_alert', label: 'Security Alert' },
              { value: 'transaction_notice', label: 'Transaction Notice' },
              { value: 'custom', label: 'Custom' },
            ],
          },
        ]}
        showDateFilter={true}
        showExport={false}
      />

      <EmailHistoryDetailDialog
        open={!!detailRecord}
        onOpenChange={(open) => !open && setDetailRecord(null)}
        record={detailRecord}
      />
    </div>
  );
}

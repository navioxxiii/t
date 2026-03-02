/**
 * Email Templates Tab
 * DataTable listing saved email templates with CRUD actions
 */

'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Plus, Send, Trash2 } from 'lucide-react';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { EditTemplateDialog } from './EditTemplateDialog';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import type { EmailTemplate } from '@/hooks/useAdminEmail';

const CATEGORY_BADGE_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
  announcement: 'info',
  product_update: 'success',
  compliance_kyc: 'warning',
  security_alert: 'danger',
  transaction_notice: 'default',
  custom: 'secondary',
};

interface EmailTemplatesTabProps {
  onUseInCompose?: (template: EmailTemplate) => void;
}

export function EmailTemplatesTab({ onUseInCompose }: EmailTemplatesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<EmailTemplate | null>(null);

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="text-text-secondary truncate max-w-[200px] block">
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
      accessorKey: 'reply_mode',
      header: 'Reply Mode',
      cell: ({ row }) => (
        <span className="text-xs text-text-tertiary">
          {row.original.reply_mode.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-text-tertiary">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
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
            <DropdownMenuItem onClick={() => setEditTemplate(row.original)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            {onUseInCompose && (
              <DropdownMenuItem onClick={() => onUseInCompose(row.original)}>
                <Send className="h-4 w-4 mr-2" /> Use in Compose
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteTemplate(row.original)} className="text-action-red">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Create Template
        </Button>
      </div>

      <DataTable
        columns={columns}
        fetchUrl="/api/admin/email/templates"
        queryKey={['admin-email-templates']}
        searchPlaceholder="Search templates..."
        filters={[
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
        showDateFilter={false}
        showExport={false}
      />

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTemplateDialog open={!!editTemplate} onOpenChange={(open) => !open && setEditTemplate(null)} template={editTemplate} />
      <DeleteTemplateDialog open={!!deleteTemplate} onOpenChange={(open) => !open && setDeleteTemplate(null)} template={deleteTemplate} />
    </div>
  );
}

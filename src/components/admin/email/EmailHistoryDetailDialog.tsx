/**
 * Email History Detail Dialog
 * Read-only dialog showing full details of a sent email
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EmailHistoryRecord } from '@/hooks/useAdminEmail';

interface EmailHistoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: EmailHistoryRecord | null;
}

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  completed: 'success',
  failed: 'danger',
  partial_failed: 'warning',
  sending: 'info',
};

export function EmailHistoryDetailDialog({ open, onOpenChange, record }: EmailHistoryDetailDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Subject</span>
              <span className="font-medium">{record.subject}</span>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Status</span>
              <Badge variant={STATUS_VARIANT[record.status] || 'default'}>
                {record.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Category</span>
              <span>{record.category.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Reply Mode</span>
              <span>{record.reply_mode.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Recipient Type</span>
              <Badge variant="outline">{record.recipient_type}</Badge>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Sent / Failed</span>
              <span>
                {record.sent_count} sent
                {record.failed_count > 0 && (
                  <span className="text-action-red"> / {record.failed_count} failed</span>
                )}
              </span>
            </div>
            {record.cta_label && (
              <div>
                <span className="text-text-tertiary block text-xs mb-1">CTA</span>
                <span>{record.cta_label}</span>
              </div>
            )}
            {record.cta_url && (
              <div>
                <span className="text-text-tertiary block text-xs mb-1">CTA URL</span>
                <span className="text-xs break-all">{record.cta_url}</span>
              </div>
            )}
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Sent By</span>
              <span>{record.sent_by_profile?.email || record.sent_by}</span>
            </div>
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Date</span>
              <span>{new Date(record.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <span className="text-text-tertiary block text-xs mb-1">Content</span>
            <div className="bg-bg-tertiary rounded-lg p-3 text-sm max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {record.content}
            </div>
          </div>

          {/* Recipient Filter */}
          {record.recipient_filter && Object.keys(record.recipient_filter).length > 0 && (
            <div>
              <span className="text-text-tertiary block text-xs mb-1">Filter Criteria</span>
              <div className="bg-bg-tertiary rounded-lg p-3 text-xs font-mono">
                {JSON.stringify(record.recipient_filter, null, 2)}
              </div>
            </div>
          )}

          {/* Recipient List */}
          {record.recipient_emails?.length > 0 && (
            <div>
              <span className="text-text-tertiary block text-xs mb-1">
                Recipients ({record.recipient_emails.length})
              </span>
              <div className="bg-bg-tertiary rounded-lg p-3 text-xs max-h-[150px] overflow-y-auto space-y-0.5">
                {record.recipient_emails.map((email) => (
                  <div key={email}>{email}</div>
                ))}
              </div>
            </div>
          )}

          {/* Error Details */}
          {record.error_details?.errors && record.error_details.errors.length > 0 && (
            <div>
              <span className="text-action-red block text-xs mb-1">Errors</span>
              <div className="bg-action-red/5 border border-action-red/20 rounded-lg p-3 text-xs max-h-[150px] overflow-y-auto space-y-0.5">
                {record.error_details.errors.map((err, i) => (
                  <div key={i} className="text-action-red">{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

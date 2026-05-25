/**
 * Email Replies Section
 * Renders inside EmailHistoryDetailDialog when reply_mode is
 * 'reply_via_dashboard'. Lists captured replies for one send, with
 * read/unread toggle and downloadable attachments.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useEmailReplies,
  useMarkReplyRead,
  type EmailReply,
  type EmailReplyAttachment,
} from '@/hooks/useAdminEmail';
import { Loader2, MailOpen, Mail, Paperclip } from 'lucide-react';

interface EmailRepliesSectionProps {
  historyId: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function AttachmentChip({ attachment }: { attachment: EmailReplyAttachment }) {
  const disabled = !attachment.signedUrl;
  const inner = (
    <>
      <Paperclip className="h-3 w-3" />
      <span className="truncate max-w-[160px]">{attachment.filename}</span>
      <span className="text-text-tertiary">{formatBytes(attachment.size)}</span>
    </>
  );

  if (disabled) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-tertiary text-xs text-text-tertiary cursor-not-allowed"
        title="Download link unavailable"
      >
        {inner}
      </span>
    );
  }

  return (
    <a
      href={attachment.signedUrl!}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-tertiary hover:bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors"
    >
      {inner}
    </a>
  );
}

function ReplyCard({ reply }: { reply: EmailReply }) {
  const markRead = useMarkReplyRead();
  const senderLabel =
    reply.user?.full_name || reply.user?.email || reply.from_name || reply.from_email;
  const isUnmatched = !reply.user_id;

  return (
    <div className="rounded-lg border border-bg-tertiary p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{senderLabel}</span>
            {isUnmatched && (
              <Badge variant="warning" className="text-[10px]">Unmatched sender</Badge>
            )}
            {!reply.is_read && (
              <Badge variant="info" className="text-[10px]">New</Badge>
            )}
          </div>
          <div className="text-xs text-text-tertiary truncate">
            {reply.from_email}
            <span className="mx-1">·</span>
            {new Date(reply.received_at).toLocaleString()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            markRead.mutate({ id: reply.id, is_read: !reply.is_read })
          }
          disabled={markRead.isPending}
          title={reply.is_read ? 'Mark unread' : 'Mark read'}
        >
          {reply.is_read ? (
            <Mail className="h-4 w-4" />
          ) : (
            <MailOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {reply.subject && (
        <div className="text-xs text-text-secondary truncate">
          Re: {reply.subject}
        </div>
      )}

      <div className="bg-bg-tertiary rounded-md p-3 text-sm whitespace-pre-wrap max-h-[240px] overflow-y-auto">
        {reply.body_clean || reply.body_text || '(empty reply)'}
      </div>

      {reply.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reply.attachments.map((att, i) => (
            <AttachmentChip key={`${att.filename}-${i}`} attachment={att} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailRepliesSection({ historyId }: EmailRepliesSectionProps) {
  const { data, isLoading, error } = useEmailReplies({ historyId, pageSize: 100 });

  const replies = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <span className="text-text-tertiary block text-xs mb-2">
        Replies {total > 0 && `(${total})`}
      </span>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading replies…
        </div>
      )}

      {error && (
        <div className="text-xs text-action-red">
          Failed to load replies: {error.message}
        </div>
      )}

      {!isLoading && !error && replies.length === 0 && (
        <div className="text-xs text-text-tertiary italic">No replies yet.</div>
      )}

      {replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

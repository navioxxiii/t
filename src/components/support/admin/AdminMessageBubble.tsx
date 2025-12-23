/**
 * Admin Message Bubble Component
 * Message display with internal note indicator
 */

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/chat/chatHelpers';

interface AdminMessageBubbleProps {
  message: {
    id: string;
    sender_type: string;
    sender?: {
      full_name?: string;
      email?: string;
    };
    message: string;
    created_at: string;
    is_internal_note: boolean;
  };
}

export function AdminMessageBubble({ message }: AdminMessageBubbleProps) {
  const isUser = message.sender_type === 'user' || message.sender_type === 'guest';
  const isSystem = message.sender_type === 'system';
  const isInternalNote = message.is_internal_note;

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="text-xs text-text-tertiary bg-bg-tertiary px-3 py-1 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }

  // Internal notes
  if (isInternalNote) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-lg p-4 bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-500">Internal Note</span>
            <span className="text-xs opacity-70 text-text-tertiary">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
          <p className="whitespace-pre-wrap wrap-break-word text-text-primary">
            {message.message}
          </p>
          <div className="mt-2 text-xs text-text-tertiary">
            By {message.sender?.full_name || message.sender?.email || 'Admin'}
          </div>
        </div>
      </div>
    );
  }

  // Regular messages
  return (
    <div className={cn('flex', isUser ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-4',
          isUser
            ? 'bg-bg-tertiary text-text-primary'
            : 'bg-brand-primary text-bg-primary'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium">
            {isUser
              ? message.sender_type === 'guest'
                ? 'Guest'
                : message.sender?.full_name || message.sender?.email || 'User'
              : message.sender?.full_name || message.sender?.email || 'Support Team'}
          </span>
          <span className="text-xs opacity-70">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        <p className="whitespace-pre-wrap wrap-break-word">{message.message}</p>
      </div>
    </div>
  );
}

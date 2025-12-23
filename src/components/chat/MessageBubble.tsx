/**
 * Message Bubble Component
 * Individual chat message display
 */

'use client';

import { Message } from '@/stores/chatStore';
import { formatMessageTime } from '@/lib/chat/chatHelpers';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const isAdmin = message.sender_type === 'admin';
  const isSystem = message.sender_type === 'system';

  // System messages (centered, subtle, italic)
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1.5 bg-bg-tertiary/50 rounded-full text-xs text-text-tertiary italic">
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
          isOwnMessage
            ? 'bg-brand-primary text-white rounded-br-sm'
            : 'bg-bg-secondary text-text-primary rounded-bl-sm border border-bg-tertiary'
        )}
      >
        {/* Sender name for admin messages */}
        {!isOwnMessage && isAdmin && (
          <div className="text-xs font-semibold text-brand-primary mb-1">
            Support Team
          </div>
        )}

        {/* Message text */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.message}
        </div>

        {/* Timestamp and read status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            isOwnMessage ? 'text-white/70 justify-end' : 'text-text-tertiary'
          )}
        >
          <span>{formatMessageTime(message.created_at)}</span>

          {/* Read receipts for own messages */}
          {isOwnMessage && (
            <>
              {message.read_by_admin ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

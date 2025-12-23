/**
 * Chat Input Component
 * Textarea input for sending chat messages
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending || disabled) {
      return;
    }

    setSending(true);

    try {
      await onSendMessage(trimmedMessage);
      setMessage(''); // Clear input on success

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('[ChatInput] Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-bg-tertiary bg-bg-primary p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          className="min-h-[40px] max-h-[120px] resize-none bg-bg-secondary border-bg-tertiary focus-visible:ring-brand-primary"
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || sending}
          size="icon"
          className="shrink-0 bg-brand-primary hover:bg-brand-primary-light"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="text-xs text-text-tertiary mt-1">
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
}

/**
 * Chat Interface Component
 * Main chat UI with messages and input
 * Includes proper cleanup for realtime subscriptions
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message } from '@/stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { sendChatMessage, scrollToBottom, markMessagesAsRead } from '@/lib/chat/chatHelpers';
import { Loader2, MessageSquare, X, Minimize2, MoreVertical, CheckCircle2, MessageCirclePlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  onClose: () => void;
  onMinimize: () => void;
  messages: Message[];
  messagesLoading: boolean;
  hasMore?: boolean;
  showFullConversationLink?: boolean;
  prefillSubject?: string;
  prefillMessage?: string;
}

export function ChatInterface({ onClose, onMinimize, messages, messagesLoading, hasMore = false, showFullConversationLink = false, prefillSubject, prefillMessage }: ChatInterfaceProps) {
  const user = useAuthStore((state) => state.user);
  const ticket = useChatStore((state) => state.activeTicket);
  const ticketLoading = useChatStore((state) => state.ticketLoading);
  const createTicket = useChatStore((state) => state.createTicket);
  const resolveTicket = useChatStore((state) => state.resolveTicket);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Optimistic messages (shown immediately while sending)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  // Filter out optimistic messages that have been replaced by real ones
  // Using useMemo to derive state instead of setState in useEffect
  const filteredOptimisticMessages = useMemo(() => {
    if (messages.length === 0 || optimisticMessages.length === 0) {
      return optimisticMessages;
    }

    // Check if any real message matches an optimistic one
    // Match by: content + sender_id + approximate timestamp (within 5 seconds)
    return optimisticMessages.filter(opt => {
      const hasRealMatch = messages.some(real => {
        // Must match content and sender
        const contentMatch = real.message === opt.message;
        const senderMatch = real.sender_id === opt.sender_id;

        // Check if timestamps are close (within 5 seconds)
        const optTime = new Date(opt.created_at).getTime();
        const realTime = new Date(real.created_at).getTime();
        const timeMatch = Math.abs(realTime - optTime) < 5000;

        return contentMatch && senderMatch && timeMatch;
      });

      // Keep optimistic message only if no real match found
      return !hasRealMatch;
    });
  }, [messages, optimisticMessages]);

  // Combine real messages + filtered optimistic messages and sort by timestamp
  const allMessages = useMemo(() => {
    const combined = [...messages, ...filteredOptimisticMessages];
    // Sort by created_at to ensure chronological order even if received out of sequence
    return combined.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, filteredOptimisticMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom(messagesContainerRef, true);
    }
  }, [allMessages]);

  // Auto-scroll on mount
  useEffect(() => {
    scrollToBottom(messagesContainerRef, false);
  }, []);

  // Consolidated mark-as-read logic
  // Mark messages as read when chat is opened OR when new admin messages arrive
  useEffect(() => {
    if (!ticket?.id || messages.length === 0) {
      return;
    }

    const hasUnreadAdminMessages = messages.some(
      msg => msg.sender_type === 'admin' && !msg.read_by_user && !msg.is_internal_note
    );

    if (hasUnreadAdminMessages) {
      console.log('[ChatInterface] Found unread admin messages, marking as read');
      // Small delay to batch multiple messages that arrive close together
      const timer = setTimeout(() => {
        markMessagesAsRead(ticket.id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages, ticket?.id]);

  // Auto-create ticket with prefill when chat opens with prefill data
  useEffect(() => {
    // Only create prefill ticket when we have prefill data and no ticket yet
    if ((prefillMessage || prefillSubject) && !ticketLoading && !ticket) {
      createTicket(prefillSubject, prefillMessage);
    }
  }, [prefillMessage, prefillSubject, ticketLoading, ticket, createTicket]);

  const handleResolveTicket = async () => {
    if (!ticket) return;

    setIsResolving(true);
    const success = await resolveTicket(ticket.id);

    if (success) {
      toast.success('Conversation marked as resolved');
    } else {
      toast.error('Failed to resolve conversation');
    }
    setIsResolving(false);
  };

  const handleStartNewChat = async () => {
    const newTicket = await createTicket();
    if (newTicket) {
      toast.success('Started new conversation');
      // Clear optimistic messages
      setOptimisticMessages([]);
    } else {
      toast.error('Failed to start new conversation');
    }
  };

  const handleSendMessage = async (message: string) => {
    console.log('[ChatInterface] Sending message:', { ticketId: ticket?.id, messageLength: message.length });
    let currentTicket = ticket;

    // Create ticket if it doesn't exist
    if (!currentTicket) {
      console.log('[ChatInterface] No active ticket, creating new ticket');
      const newTicket = await createTicket();
      if (!newTicket) {
        console.error('[ChatInterface] Failed to create ticket');
        toast.error('Failed to start conversation');
        return;
      }
      console.log('[ChatInterface] Created new ticket:', newTicket.id);
      currentTicket = newTicket;
    }

    // Create optimistic message (shows immediately)
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      ticket_id: currentTicket.id,
      sender_id: user?.id || '',
      sender_type: 'user',
      sender_email: user?.email || null,
      message: message,
      is_internal_note: false,
      created_at: new Date().toISOString(),
      read_by_user: true,
      read_by_admin: false,
      read_at: null,
    };

    console.log('[ChatInterface] Adding optimistic message:', optimisticId);
    // Add optimistic message immediately to UI
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    // Send the message via API
    const result = await sendChatMessage(currentTicket.id, message);
    console.log('[ChatInterface] sendChatMessage result:', result);
    if (!result.success) {
      console.error('[ChatInterface] Failed to send message:', result.error);
      // Remove optimistic message on error
      setOptimisticMessages(prev =>
        prev.filter(m => m.id !== optimisticId)
      );
      toast.error(result.error || 'Failed to send message');
    } else if (result.newTicket) {
      // A new ticket was created (e.g., the old one was deleted)
      // Clear optimistic messages and switch to the new ticket
      console.log('[ChatInterface] 🔄 Switching to new ticket:', result.newTicket);
      setOptimisticMessages([]);

      // Refetch active ticket to get the new one
      // This will clear messages and set up new subscription
      await useChatStore.getState().fetchActiveTicket();

      toast.success('Your message was sent to a new conversation');
    } else {
      console.log('[ChatInterface] ✅ Message sent successfully, waiting for realtime update');
    }
    // Note: Optimistic message will be automatically replaced when
    // realtime subscription receives the actual message.
    // We keep the optimistic message until then to avoid flicker.
  };

  const isLoading = ticketLoading || messagesLoading;
  const isResolved = ticket?.status === 'resolved';

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-bg-tertiary bg-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Support Chat</h3>
            <p className="text-xs text-text-tertiary">
              {ticket ? `Ticket #${ticket.ticket_number}` : 'Start a conversation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Ticket Menu */}
          {ticket && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-secondary hover:text-text-primary"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[10000]">
                <DropdownMenuItem onClick={handleResolveTicket} disabled={isResolving}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStartNewChat}>
                  <MessageCirclePlus className="mr-2 h-4 w-4" />
                  Start New Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMinimize}
            className="text-text-secondary hover:text-text-primary"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-text-tertiary" />
            </div>
            <h4 className="font-semibold text-text-primary mb-2">
              Start a conversation
            </h4>
            <p className="text-sm text-text-secondary mb-6">
              Send us a message and our support team will get back to you as soon as possible.
            </p>
          </div>
        ) : (
          <>
            {/* Message Limit Notice */}
            {hasMore && showFullConversationLink && (
              <div className="mb-3 p-3 bg-bg-tertiary/50 rounded-lg border border-bg-tertiary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">
                      Showing recent messages
                    </p>
                  </div>
                  <Link
                    href="/support"
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary-light transition-colors"
                  >
                    View full conversation
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {allMessages
              .filter(msg => !msg.is_internal_note) // Hide admin notes
              .map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === user?.id}
                />
              ))}

            {/* Resolved Ticket Banner */}
            {isResolved && (
              <div className="mt-4 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <h4 className="font-semibold">Conversation Resolved</h4>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  This conversation has been marked as resolved.
                </p>
                <Button onClick={handleStartNewChat} variant="default" size="sm">
                  <MessageCirclePlus className="w-4 h-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || isResolved}
        placeholder={isResolved ? "Conversation is resolved" : "Type your message..."}
      />
    </div>
  );
}

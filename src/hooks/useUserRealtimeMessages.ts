/**
 * useUserRealtimeMessages Hook
 * Subscribe to real-time message updates for user support ticket view
 * Replaces 10-second polling with instant Supabase Realtime updates
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'admin' | 'guest' | 'system';
  sender_email: string | null;
  message: string;
  created_at: string;
  read_by_user: boolean;
  read_by_admin: boolean;
  read_at: string | null;
  sender?: {
    full_name?: string;
    email?: string;
  };
}

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_name: string | null;
}

interface UseUserRealtimeMessagesReturn {
  ticket: Ticket | null;
  messages: TicketMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRealtimeMessages(
  ticketId: string | null
): UseUserRealtimeMessagesReturn {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(!!ticketId);
  const [error, setError] = useState<string | null>(null);

  // Use refs for subscription state to persist across effect reruns
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable fetch function that doesn't cause effect reruns
  const fetchTicketData = useCallback(async () => {
    if (!ticketId) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ticket');
      }
      const data = await response.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      console.error('[useUserRealtimeMessages] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      setError(null);
      isSubscribedRef.current = false;
      return;
    }

    const supabase = createClient();

    // Reset state for new ticket
    setLoading(true);
    retryCountRef.current = 0;

    const setupRealtimeSubscription = async () => {
      try {
        // Prevent duplicate subscriptions using ref
        if (isSubscribedRef.current && channelRef.current) {
          console.log('[useUserRealtimeMessages] ⚠️ Already subscribed, skipping setup');
          return;
        }

        console.log('[useUserRealtimeMessages] 🔌 Setting up subscription for ticket:', ticketId);

        // Fetch initial data
        const response = await fetch(`/api/support/tickets/${ticketId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch ticket');
        }
        const data = await response.json();
        setTicket(data.ticket);
        setMessages(data.messages || []);
        setError(null);

        // Clean up any existing channel before creating new one
        if (channelRef.current) {
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Create realtime channel with deterministic name (no Date.now())
        const channelName = `user-ticket-messages-${ticketId}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // Subscribe to new message inserts
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_messages',
              filter: `ticket_id=eq.${ticketId}`,
            },
            (payload: RealtimePostgresChangesPayload<TicketMessage>) => {
              const newMessage = payload.new as TicketMessage;

              // Skip internal notes (should never come through for users, but be safe)
              if ((payload.new as { is_internal_note?: boolean }).is_internal_note) {
                return;
              }

              console.log('[useUserRealtimeMessages] 📨 New message received:', newMessage.id);

              setMessages((prevMessages) => {
                // Prevent duplicates by ID
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                  return prevMessages;
                }
                // Add message and sort by timestamp
                const updated = [...prevMessages, newMessage].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                return updated;
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'ticket_messages',
              filter: `ticket_id=eq.${ticketId}`,
            },
            (payload: RealtimePostgresChangesPayload<TicketMessage>) => {
              const updatedMessage = payload.new as TicketMessage;

              setMessages((prevMessages) =>
                prevMessages.map(msg =>
                  msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                )
              );
            }
          )
          // Also subscribe to ticket updates (status changes, etc.)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'support_tickets',
              filter: `id=eq.${ticketId}`,
            },
            (payload: RealtimePostgresChangesPayload<Ticket>) => {
              const updatedTicket = payload.new as Ticket;
              setTicket(prev => prev ? { ...prev, ...updatedTicket } : updatedTicket);
            }
          )
          .subscribe((status: string) => {
            console.log('[useUserRealtimeMessages] 📡 Subscription status:', status);

            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              setLoading(false);
              setError(null);
              retryCountRef.current = 0;
              console.log('[useUserRealtimeMessages] ✅ SUBSCRIBED - Channel active');
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              isSubscribedRef.current = false;
              setError('Connection error. Retrying...');
              setLoading(false);
              console.error('[useUserRealtimeMessages] ❌ Connection error:', status);

              // Retry with exponential backoff
              const maxRetries = 5;
              if (retryCountRef.current < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`[useUserRealtimeMessages] 🔄 Retrying in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);

                retryTimeoutRef.current = setTimeout(() => {
                  retryCountRef.current++;
                  setupRealtimeSubscription();
                }, delay);
              } else {
                setError('Connection failed. Please refresh the page.');
                console.error('[useUserRealtimeMessages] ❌ Max retries reached');
              }
            }

            if (status === 'CLOSED') {
              isSubscribedRef.current = false;
              console.log('[useUserRealtimeMessages] 🔌 Channel closed');
            }
          });

      } catch (err) {
        console.error('[useUserRealtimeMessages] Setup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to chat');
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      console.log('[useUserRealtimeMessages] 🧹 Cleanup - unsubscribing from ticket:', ticketId);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      isSubscribedRef.current = false;

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ticketId]); // Only depend on ticketId - no fetchTicketData

  return { ticket, messages, loading, error, refetch: fetchTicketData };
}

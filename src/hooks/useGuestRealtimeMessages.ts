/**
 * useGuestRealtimeMessages Hook
 * Subscribe to real-time message updates for guest support ticket view
 * Uses token-based access instead of authentication
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface GuestTicketMessage {
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
}

export interface GuestTicket {
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
  is_guest: boolean;
}

interface UseGuestRealtimeMessagesReturn {
  ticket: GuestTicket | null;
  messages: GuestTicketMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGuestRealtimeMessages(
  token: string | null
): UseGuestRealtimeMessagesReturn {
  const [ticket, setTicket] = useState<GuestTicket | null>(null);
  const [messages, setMessages] = useState<GuestTicketMessage[]>([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);

  // Use refs for subscription state to persist across effect reruns
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ticketIdRef = useRef<string | null>(null);

  // Stable fetch function for manual refetch
  const fetchTicketData = useCallback(async () => {
    if (!token) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/support/guest/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ticket');
      }
      const data = await response.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      ticketIdRef.current = data.ticket?.id || null;
      setError(null);
    } catch (err) {
      console.error('[useGuestRealtimeMessages] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      setError(null);
      isSubscribedRef.current = false;
      return;
    }

    const supabase = createClient();

    // Reset state for new token
    setLoading(true);
    retryCountRef.current = 0;

    const setupRealtimeSubscription = async () => {
      try {
        // Prevent duplicate subscriptions using ref
        if (isSubscribedRef.current && channelRef.current) {
          console.log('[useGuestRealtimeMessages] ⚠️ Already subscribed, skipping setup');
          return;
        }

        console.log('[useGuestRealtimeMessages] 🔌 Setting up subscription for token:', token);

        // Fetch initial data first to get the ticket ID
        const response = await fetch(`/api/support/guest/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch ticket');
        }
        const data = await response.json();

        // Use the fetched ticket ID directly (fix race condition)
        const ticketId = data.ticket?.id;
        if (!ticketId) {
          console.error('[useGuestRealtimeMessages] No ticket ID in response');
          setError('Ticket not found');
          setLoading(false);
          return;
        }

        // Update state with fetched data
        setTicket(data.ticket);
        setMessages(data.messages || []);
        ticketIdRef.current = ticketId;
        setError(null);

        // Clean up any existing channel before creating new one
        if (channelRef.current) {
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Create realtime channel with deterministic name (no Date.now())
        const channelName = `guest-ticket-messages-${ticketId}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_messages',
              filter: `ticket_id=eq.${ticketId}`,
            },
            (payload: RealtimePostgresChangesPayload<GuestTicketMessage>) => {
              const newMessage = payload.new as GuestTicketMessage;

              // Skip internal notes
              if ((payload.new as { is_internal_note?: boolean }).is_internal_note) {
                return;
              }

              console.log('[useGuestRealtimeMessages] 📨 New message received:', newMessage.id);

              setMessages((prevMessages) => {
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                  return prevMessages;
                }
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
            (payload: RealtimePostgresChangesPayload<GuestTicketMessage>) => {
              const updatedMessage = payload.new as GuestTicketMessage;

              setMessages((prevMessages) =>
                prevMessages.map(msg =>
                  msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                )
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'support_tickets',
              filter: `id=eq.${ticketId}`,
            },
            (payload: RealtimePostgresChangesPayload<GuestTicket>) => {
              const updatedTicket = payload.new as GuestTicket;
              setTicket(prev => prev ? { ...prev, ...updatedTicket } : updatedTicket);
            }
          )
          .subscribe((status: string) => {
            console.log('[useGuestRealtimeMessages] 📡 Subscription status:', status);

            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              setLoading(false);
              setError(null);
              retryCountRef.current = 0;
              console.log('[useGuestRealtimeMessages] ✅ SUBSCRIBED - Channel active');
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              isSubscribedRef.current = false;
              setError('Connection error. Retrying...');
              setLoading(false);
              console.error('[useGuestRealtimeMessages] ❌ Connection error:', status);

              const maxRetries = 5;
              if (retryCountRef.current < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`[useGuestRealtimeMessages] 🔄 Retrying in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);

                retryTimeoutRef.current = setTimeout(() => {
                  retryCountRef.current++;
                  setupRealtimeSubscription();
                }, delay);
              } else {
                setError('Connection failed. Please refresh the page.');
                console.error('[useGuestRealtimeMessages] ❌ Max retries reached');
              }
            }

            if (status === 'CLOSED') {
              isSubscribedRef.current = false;
              console.log('[useGuestRealtimeMessages] 🔌 Channel closed');
            }
          });

      } catch (err) {
        console.error('[useGuestRealtimeMessages] Setup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to chat');
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      console.log('[useGuestRealtimeMessages] 🧹 Cleanup - unsubscribing from token:', token);

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
  }, [token]); // Only depend on token - no fetchTicketData

  return { ticket, messages, loading, error, refetch: fetchTicketData };
}

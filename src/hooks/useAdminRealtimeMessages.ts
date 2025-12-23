/**
 * useAdminRealtimeMessages Hook
 * Subscribe to real-time message updates for admin support ticket view
 * Similar to useRealtimeMessages but includes ticket updates and admin-specific features
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'admin' | 'guest' | 'system';
  sender_email: string | null;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  read_by_user: boolean;
  read_by_admin: boolean;
  read_at: string | null;
  sender?: {
    full_name?: string;
    email?: string;
  };
}

interface UseAdminRealtimeMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminRealtimeMessages(
  ticketId: string | null
): UseAdminRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!!ticketId);
  const [error, setError] = useState<string | null>(null);

  // Use refs for subscription state to persist across effect reruns
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable fetch function for manual refetch
  const fetchMessages = useCallback(async () => {
    if (!ticketId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[useAdminRealtimeMessages] Fetching messages for ticket:', ticketId);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      console.log('[useAdminRealtimeMessages] Loaded', data.messages?.length || 0, 'messages');
    } catch (err) {
      console.error('[useAdminRealtimeMessages] Fetch error:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) {
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
          console.log('[useAdminRealtimeMessages] ⚠️ Already subscribed, skipping setup');
          return;
        }

        console.log('[useAdminRealtimeMessages] 🔌 Setting up subscription for ticket:', ticketId);

        // Fetch initial messages
        const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data.messages || []);
        setError(null);
        console.log('[useAdminRealtimeMessages] Loaded', data.messages?.length || 0, 'initial messages');

        // Clean up any existing channel before creating new one
        if (channelRef.current) {
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Create realtime channel with deterministic name (no Date.now())
        const channelName = `admin-ticket-messages-${ticketId}`;
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
            (payload: RealtimePostgresChangesPayload<Message>) => {
              console.log('[useAdminRealtimeMessages] 📨 New message received:', payload.new);

              const newMessage = payload.new as Message;

              setMessages((prevMessages) => {
                // Prevent duplicates by ID
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                  console.log('[useAdminRealtimeMessages] ⚠️ Duplicate message detected, skipping');
                  return prevMessages;
                }
                // Add message and sort by timestamp
                const updated = [...prevMessages, newMessage].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                console.log('[useAdminRealtimeMessages] ✅ Message added, total:', updated.length);
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
            (payload: RealtimePostgresChangesPayload<Message>) => {
              console.log('[useAdminRealtimeMessages] 🔄 Message updated:', payload.new);

              const updatedMessage = payload.new as Message;

              setMessages((prevMessages) =>
                prevMessages.map(msg =>
                  msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                )
              );
            }
          )
          .subscribe((status: string) => {
            console.log('[useAdminRealtimeMessages] 📡 Subscription status:', status, 'for ticket:', ticketId);

            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              setLoading(false);
              setError(null);
              retryCountRef.current = 0;
              console.log('[useAdminRealtimeMessages] ✅ SUBSCRIBED - Channel active');
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              isSubscribedRef.current = false;
              console.error('[useAdminRealtimeMessages] ❌ Connection error:', status);
              setError('Connection error. Retrying...');
              setLoading(false);

              // Retry with exponential backoff
              const maxRetries = 5;
              if (retryCountRef.current < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`[useAdminRealtimeMessages] 🔄 Retrying in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);

                retryTimeoutRef.current = setTimeout(() => {
                  retryCountRef.current++;
                  setupRealtimeSubscription();
                }, delay);
              } else {
                setError('Connection failed. Please refresh the page.');
                console.error('[useAdminRealtimeMessages] ❌ Max retries reached');
              }
            }

            if (status === 'CLOSED') {
              isSubscribedRef.current = false;
              console.log('[useAdminRealtimeMessages] 🔌 Channel closed');
            }
          });

      } catch (err) {
        console.error('[useAdminRealtimeMessages] Setup error:', err);
        setError('Failed to connect to chat');
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      console.log('[useAdminRealtimeMessages] 🧹 Cleanup - unsubscribing from ticket:', ticketId);

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

      console.log('[useAdminRealtimeMessages] ✅ Cleanup complete');
    };
  }, [ticketId]); // Only depend on ticketId

  return { messages, loading, error, refetch: fetchMessages };
}

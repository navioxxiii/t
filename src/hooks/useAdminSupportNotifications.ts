/**
 * useAdminSupportNotifications Hook
 * Subscribe to real-time notifications for new support tickets and user replies
 * Shows toast notifications and provides unread counts for badges
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  user_email: string;
  priority: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_email: string;
  message: string;
  is_internal_note: boolean;
}

interface SupportNotification {
  id: string;
  type: 'new_ticket' | 'new_message';
  ticketId: string;
  ticketNumber?: string;
  subject?: string;
  senderEmail?: string;
  message?: string;
  timestamp: Date;
}

interface UseAdminSupportNotificationsReturn {
  unreadTicketsCount: number;
  unreadMessagesCount: number;
  totalUnread: number;
  notifications: SupportNotification[];
  clearNotifications: () => void;
  isConnected: boolean;
}

export function useAdminSupportNotifications(): UseAdminSupportNotificationsReturn {
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs for subscription state to persist across effect reruns
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      console.log('[useAdminSupportNotifications] 📊 Fetching unread counts...');
      const response = await fetch('/api/admin/support/stats');
      if (response.ok) {
        const data = await response.json();
        const unreadMsgs = data.stats?.unreadMessages || 0;
        const openCount = (data.stats?.byStatus?.open || 0) + (data.stats?.byStatus?.pending || 0);
        setUnreadMessagesCount(unreadMsgs);
        setUnreadTicketsCount(openCount);
        console.log('[useAdminSupportNotifications] 📊 Counts updated - Messages:', unreadMsgs, 'Tickets:', openCount);
      }
    } catch (error) {
      console.error('[useAdminSupportNotifications] ❌ Failed to fetch stats:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const setupSubscription = async () => {
      try {
        // Prevent duplicate subscriptions using ref
        if (isSubscribedRef.current && channelRef.current) {
          console.log('[useAdminSupportNotifications] ⚠️ Already subscribed, skipping setup');
          return;
        }

        console.log('[useAdminSupportNotifications] 🔌 Setting up subscription...');

        // Fetch initial counts
        await fetchUnreadCounts();

        // Clean up any existing channel before creating new one
        if (channelRef.current) {
          console.log('[useAdminSupportNotifications] 🧹 Cleaning up existing channel');
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Use deterministic channel name (no Date.now())
        const channelName = 'admin-support-notifications';
        console.log('[useAdminSupportNotifications] 📡 Creating channel:', channelName);
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
          // Listen for new tickets
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'support_tickets',
            },
            (payload: RealtimePostgresChangesPayload<SupportTicket>) => {
              console.log('[useAdminSupportNotifications] 🎫 New ticket received:', payload.new);

              const newTicket = payload.new as SupportTicket;

              // Update count
              setUnreadTicketsCount((prev) => {
                const newCount = prev + 1;
                console.log('[useAdminSupportNotifications] 🔔 Ticket count updated:', newCount);
                return newCount;
              });

              // Add notification
              const notification: SupportNotification = {
                id: `ticket-${newTicket.id}`,
                type: 'new_ticket',
                ticketId: newTicket.id,
                ticketNumber: newTicket.ticket_number,
                subject: newTicket.subject,
                senderEmail: newTicket.user_email,
                timestamp: new Date(),
              };
              setNotifications((prev) => [notification, ...prev].slice(0, 50));

              // Show toast notification
              const isUrgent = newTicket.priority === 'urgent' || newTicket.priority === 'high';
              toast(isUrgent ? '🚨 Urgent Support Ticket' : '🎫 New Support Ticket', {
                description: `${newTicket.ticket_number}: ${newTicket.subject}`,
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.href = `/admin/support/${newTicket.id}`;
                  },
                },
                duration: isUrgent ? 10000 : 5000,
              });
            }
          )
          // Listen for new messages from users/guests
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ticket_messages',
            },
            async (payload: RealtimePostgresChangesPayload<TicketMessage>) => {
              console.log('[useAdminSupportNotifications] 💬 New message received:', payload.new);

              const newMessage = payload.new as TicketMessage;

              // Only notify for user/guest messages, not admin messages or internal notes
              if (
                !['user', 'guest'].includes(newMessage.sender_type) ||
                newMessage.is_internal_note
              ) {
                console.log('[useAdminSupportNotifications] ⏭️ Skipping - not a user/guest message');
                return;
              }

              // Update unread count
              setUnreadMessagesCount((prev) => {
                const newCount = prev + 1;
                console.log('[useAdminSupportNotifications] 🔔 Message count updated:', newCount);
                return newCount;
              });

              // Try to get ticket info for better notification
              let ticketNumber = '';
              try {
                const { data } = await supabase
                  .from('support_tickets')
                  .select('ticket_number')
                  .eq('id', newMessage.ticket_id)
                  .single();
                ticketNumber = data?.ticket_number || '';
              } catch {
                // Ignore error
              }

              // Add notification
              const notification: SupportNotification = {
                id: `message-${newMessage.id}`,
                type: 'new_message',
                ticketId: newMessage.ticket_id,
                ticketNumber,
                senderEmail: newMessage.sender_email,
                message: newMessage.message.substring(0, 100),
                timestamp: new Date(),
              };
              setNotifications((prev) => [notification, ...prev].slice(0, 50));

              // Show toast notification
              toast('💬 New Reply', {
                description: ticketNumber
                  ? `${ticketNumber}: ${newMessage.message.substring(0, 50)}...`
                  : newMessage.message.substring(0, 50) + '...',
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.href = `/admin/support/${newMessage.ticket_id}`;
                  },
                },
              });
            }
          )
          .subscribe((status: string) => {
            console.log('[useAdminSupportNotifications] 📡 Subscription status:', status);

            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              setIsConnected(true);
              retryCountRef.current = 0;
              console.log('[useAdminSupportNotifications] ✅ SUBSCRIBED - Channel active');
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              isSubscribedRef.current = false;
              setIsConnected(false);
              console.error('[useAdminSupportNotifications] ❌ Connection error:', status);

              // Retry with exponential backoff (max 5 retries)
              const maxRetries = 5;
              if (retryCountRef.current < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`[useAdminSupportNotifications] 🔄 Retrying in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);

                retryTimeoutRef.current = setTimeout(() => {
                  retryCountRef.current++;
                  setupSubscription();
                }, delay);
              } else {
                console.error('[useAdminSupportNotifications] ❌ Max retries reached');
              }
            }

            if (status === 'CLOSED') {
              isSubscribedRef.current = false;
              setIsConnected(false);
              console.log('[useAdminSupportNotifications] 🔌 Channel closed');
            }
          });
      } catch (error) {
        console.error('[useAdminSupportNotifications] ❌ Setup error:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    // Refresh counts periodically as backup
    const countInterval = setInterval(fetchUnreadCounts, 60000);

    return () => {
      console.log('[useAdminSupportNotifications] 🧹 Cleanup - unsubscribing');

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      clearInterval(countInterval);

      isSubscribedRef.current = false;

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchUnreadCounts]);

  return {
    unreadTicketsCount,
    unreadMessagesCount,
    totalUnread: unreadTicketsCount + unreadMessagesCount,
    notifications,
    clearNotifications,
    isConnected,
  };
}

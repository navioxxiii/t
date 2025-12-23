import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useEffect } from 'react';

// Types
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
}

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// State interface
interface ChatState {
  // UI state
  isChatOpen: boolean;

  // Ticket state
  activeTicket: Ticket | null;
  ticketLoading: boolean;

  // Messages state
  messages: Message[];
  messagesLoading: boolean;
  hasMore: boolean;
  unreadCount: number;

  // Real-time state (internal)
  realtimeChannel: RealtimeChannel | null;
  retryTimeout: NodeJS.Timeout | null;
  retryCount: number;
  subscribedTicketId: string | null;

  // Actions - UI
  setChatOpen: (isOpen: boolean) => void;
  resetUnreadCount: () => void;

  // Actions - Ticket
  fetchActiveTicket: () => Promise<void>;
  createTicket: (subject?: string, message?: string) => Promise<Ticket | null>;
  resolveTicket: (ticketId: string) => Promise<boolean>;

  // Actions - Messages
  fetchMessages: (ticketId: string, limit: number) => Promise<void>;
  sendMessage: (ticketId: string, message: string) => Promise<boolean>;
  markMessagesAsRead: (ticketId: string) => Promise<void>;

  // Actions - Real-time
  subscribeToMessages: (ticketId: string) => void;
  unsubscribeFromMessages: () => void;

  // Cleanup
  cleanup: () => void;
}

// Sound notification helper
const playNotificationSound = () => {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.log('[ChatStore] Sound error:', err);
    });
  } catch (err) {
    console.log('[ChatStore] Sound error:', err);
  }
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  isChatOpen: false,
  activeTicket: null,
  ticketLoading: false,
  messages: [],
  messagesLoading: false,
  hasMore: false,
  unreadCount: 0,
  realtimeChannel: null,
  retryTimeout: null,
  retryCount: 0,
  subscribedTicketId: null,

  // UI actions
  setChatOpen: (isOpen) => {
    set({ isChatOpen: isOpen });

    // Reset unread count when opening chat
    if (isOpen) {
      const { activeTicket } = get();
      set({ unreadCount: 0 });

      // Mark messages as read
      if (activeTicket) {
        get().markMessagesAsRead(activeTicket.id);
      }
    }
  },

  resetUnreadCount: () => set({ unreadCount: 0 }),

  // Ticket actions
  fetchActiveTicket: async () => {
    set({ ticketLoading: true });

    try {
      const response = await fetch('/api/support/tickets');
      if (!response.ok) throw new Error('Failed to fetch ticket');

      const data = await response.json();
      const tickets = data.tickets || [];

      // Get most recent active ticket
      const activeTicket = tickets
        .filter((t: Ticket) =>
          ['open', 'pending', 'in_progress', 'resolved'].includes(t.status)
        )
        .sort((a: Ticket, b: Ticket) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0] || null;

      set({ activeTicket });

      // Subscribe to real-time updates if ticket exists
      if (activeTicket) {
        get().subscribeToMessages(activeTicket.id);
        get().fetchMessages(activeTicket.id, 50);
      }

    } catch (error) {
      console.error('[ChatStore] Fetch ticket error:', error);
    } finally {
      set({ ticketLoading: false });
    }
  },

  createTicket: async (subject = 'Chat conversation', message = 'User started a chat conversation') => {
    try {
      const response = await fetch('/api/support/tickets/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category: 'other', message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create ticket');
      }

      const data = await response.json();
      const newTicket = data.ticket;

      // Clear old messages and set new ticket
      set({ activeTicket: newTicket, messages: [], unreadCount: 0 });

      // Subscribe to new ticket
      get().subscribeToMessages(newTicket.id);

      // Fetch messages for the new ticket (includes the initial message)
      await get().fetchMessages(newTicket.id, 50);

      return newTicket;
    } catch (error) {
      console.error('[ChatStore] Create ticket error:', error);
      return null;
    }
  },

  resolveTicket: async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' }),
      });

      if (!response.ok) throw new Error('Failed to resolve ticket');

      // Refetch ticket to update status
      await get().fetchActiveTicket();

      return true;
    } catch (error) {
      console.error('[ChatStore] Resolve ticket error:', error);
      return false;
    }
  },

  // Message actions
  fetchMessages: async (ticketId: string, limit: number) => {
    set({ messagesLoading: true });

    try {
      const supabase = createClient();

      // Get message count
      const { count } = await supabase
        .from('ticket_messages')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_id', ticketId);

      // Fetch messages
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const messages = (data || []).reverse();
      const hasMore = (count || 0) > limit;

      // Count unread messages
      const unreadCount = messages.filter(
        (msg: Message) =>
          msg.sender_type === 'admin' &&
          !msg.read_by_user &&
          !msg.is_internal_note
      ).length;

      set({
        messages,
        hasMore,
        unreadCount,
        messagesLoading: false
      });

    } catch (error) {
      console.error('[ChatStore] Fetch messages error:', error);
      set({ messagesLoading: false });
    }
  },

  sendMessage: async (ticketId: string, message: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      return true;
    } catch (error) {
      console.error('[ChatStore] Send message error:', error);
      return false;
    }
  },

  markMessagesAsRead: async (ticketId: string) => {
    try {
      await fetch(`/api/support/tickets/${ticketId}/mark-read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('[ChatStore] Mark read error:', error);
    }
  },

  // Real-time subscription
  subscribeToMessages: (ticketId: string) => {
    const { realtimeChannel, unsubscribeFromMessages, subscribedTicketId } = get();

    // Skip if already subscribed to this ticket
    if (subscribedTicketId === ticketId && realtimeChannel) {
      console.log('[ChatStore] ⚠️ Already subscribed to this ticket, skipping');
      return;
    }

    // Cleanup existing subscription to different ticket
    if (realtimeChannel) {
      unsubscribeFromMessages();
    }

    console.log('[ChatStore] 🔌 Subscribing to ticket:', ticketId);

    const supabase = createClient();
    // Use deterministic channel name (no Date.now() to prevent duplicate subscriptions)
    const channelName = `ticket-messages-${ticketId}`;
    const channel = supabase.channel(channelName);

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
          console.log('[ChatStore] 📨 New message received:', payload.new);
          const newMessage = payload.new as Message;

          set((state) => {
            // Prevent duplicates
            if (state.messages.some(msg => msg.id === newMessage.id)) {
              console.log('[ChatStore] ⚠️ Duplicate message, skipping:', newMessage.id);
              return state;
            }

            // Add message
            const messages = [...state.messages, newMessage].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            console.log('[ChatStore] ✅ Message added, total:', messages.length);

            // Update unread count if admin message and chat closed
            let unreadCount = state.unreadCount;
            if (
              newMessage.sender_type === 'admin' &&
              !newMessage.is_internal_note &&
              !state.isChatOpen
            ) {
              unreadCount++;
              console.log('[ChatStore] 🔔 Unread count updated:', unreadCount);
              playNotificationSound();
            }

            return { messages, unreadCount };
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
          console.log('[ChatStore] 🔄 Message updated:', payload.new);
          const updatedMessage = payload.new as Message;

          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          }));
        }
      )
      .subscribe((status: string) => {
        console.log('[ChatStore] 📡 Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          set({ retryCount: 0 });
          console.log('[ChatStore] ✅ SUBSCRIBED - Channel active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[ChatStore] ❌ Connection error:', status);
          const { retryCount, retryTimeout } = get();

          if (retryTimeout) clearTimeout(retryTimeout);

          if (retryCount < 5) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            console.log(`[ChatStore] 🔄 Retrying in ${delay}ms (attempt ${retryCount + 1}/5)`);

            const timeout = setTimeout(() => {
              set({ retryCount: retryCount + 1 });
              get().subscribeToMessages(ticketId);
            }, delay);

            set({ retryTimeout: timeout });
          } else {
            console.error('[ChatStore] ❌ Max retries reached');
          }
        } else if (status === 'CLOSED') {
          console.log('[ChatStore] 🔌 Channel closed');
        }
      });

    set({ realtimeChannel: channel, subscribedTicketId: ticketId });
  },

  unsubscribeFromMessages: () => {
    const { realtimeChannel, retryTimeout } = get();

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      set({ retryTimeout: null });
    }

    if (realtimeChannel) {
      console.log('[ChatStore] 🧹 Unsubscribing...');
      const supabase = createClient();
      realtimeChannel.unsubscribe();
      supabase.removeChannel(realtimeChannel);
      // Note: Don't reset retryCount here - let retry logic handle it
      set({ realtimeChannel: null, subscribedTicketId: null });
    }
  },

  // Cleanup all resources
  cleanup: () => {
    get().unsubscribeFromMessages();
    set({
      messages: [],
      activeTicket: null,
      unreadCount: 0,
      retryCount: 0,
    });
  },
}));

// Initialization hook (call once on app mount)
export const useChatInit = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fetch active ticket on mount - use getState() to avoid dependency issues
    useChatStore.getState().fetchActiveTicket();

    // Cleanup on unmount
    return () => {
      useChatStore.getState().cleanup();
    };
  }, []); // Empty deps - only run once on mount
};

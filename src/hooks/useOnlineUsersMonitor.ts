'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface OnlineUser {
  user_id: string;
  email?: string;
  name?: string;
  online_at: string;
}

/**
 * Hook for admins to monitor all online users.
 * Subscribes to the global presence channel and returns a list of online users.
 */
export function useOnlineUsersMonitor() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) {
      console.log('[useOnlineUsersMonitor] Already subscribed, skipping');
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel('global-presence');

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const usersMap = new Map<string, OnlineUser>();

      Object.entries(state).forEach(([key, presences]) => {
        const presenceArray = presences as OnlineUser[];
        const presence = presenceArray[0];
        if (presence?.user_id) {
          usersMap.set(presence.user_id, presence);
        }
      });

      console.log('[useOnlineUsersMonitor] 📡 Presence sync - online users:', usersMap.size);
      setOnlineUsers(usersMap);
    });

    channel.on('presence', { event: 'join' }, ({ key }: { key: string; newPresences: OnlineUser[] }) => {
      console.log('[useOnlineUsersMonitor] 🟢 User joined:', key);
    });

    channel.on('presence', { event: 'leave' }, ({ key }: { key: string; leftPresences: OnlineUser[] }) => {
      console.log('[useOnlineUsersMonitor] 🔴 User left:', key);
    });

    channel.subscribe((status: string) => {
      console.log('[useOnlineUsersMonitor] 📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        console.log('[useOnlineUsersMonitor] ✅ Monitoring online users');
      }
    });

    channelRef.current = channel;

    return () => {
      console.log('[useOnlineUsersMonitor] 🧹 Cleanup - stopping monitor');
      isSubscribedRef.current = false;

      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    onlineUsers,
    onlineUsersList: Array.from(onlineUsers.values()),
    isUserOnline: (userId: string) => onlineUsers.has(userId),
    getOnlineUser: (userId: string) => onlineUsers.get(userId),
    onlineCount: onlineUsers.size,
  };
}

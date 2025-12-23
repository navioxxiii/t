'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to broadcast user's online presence to a global channel.
 * Should be called in the dashboard layout to track when users are online.
 */
export function useGlobalPresence(
  userId: string | null,
  userEmail?: string,
  userName?: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    // Prevent duplicate tracking
    if (isTrackingRef.current) {
      console.log('[useGlobalPresence] Already tracking, skipping');
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel('global-presence', {
      config: { presence: { key: userId } },
    });

    channel.subscribe(async (status: string) => {
      console.log('[useGlobalPresence] 📡 Subscription status:', status);

      if (status === 'SUBSCRIBED') {
        isTrackingRef.current = true;
        await channel.track({
          user_id: userId,
          email: userEmail,
          name: userName,
          online_at: new Date().toISOString(),
        });
        console.log('[useGlobalPresence] ✅ Now broadcasting presence');
      }
    });

    channelRef.current = channel;

    return () => {
      console.log('[useGlobalPresence] 🧹 Cleanup - stopping presence broadcast');
      isTrackingRef.current = false;

      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, userEmail, userName]);
}

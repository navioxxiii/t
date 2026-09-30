'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/authStore';

declare global {
  interface Window {
    Tawk_API?: {
      visitor?: { name?: string; email?: string };
      onLoad?: () => void;
      setAttributes?: (attrs: Record<string, string>, callback?: (error: unknown) => void) => void;
      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      onChatMinimized?: () => void;
      onUnreadCountChanged?: (count: number) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

// ─── Bubble visibility + unread count, shared with the app header ───

// App screens hide Tawk's floating bubble and open chat from the header instead
let bubbleHidden = false;
let loaded = false;
let unreadCount = 0;
const unreadListeners = new Set<() => void>();

function setUnreadCount(count: number) {
  unreadCount = count;
  unreadListeners.forEach((notify) => notify());
}

/** Open the support chat, even when the floating bubble is hidden */
export function openSupportChat() {
  window.Tawk_API?.showWidget?.();
  window.Tawk_API?.maximize?.();
}

/** Hide the floating bubble while the calling component is mounted */
export function useHideTawkBubble() {
  useEffect(() => {
    bubbleHidden = true;
    if (loaded) window.Tawk_API?.hideWidget?.();
    return () => {
      bubbleHidden = false;
      if (loaded) window.Tawk_API?.showWidget?.();
    };
  }, []);
}

/** Unread chat messages, for an indicator on the support button */
export function useTawkUnreadCount() {
  return useSyncExternalStore(
    (notify) => {
      unreadListeners.add(notify);
      return () => unreadListeners.delete(notify);
    },
    () => unreadCount,
    () => 0
  );
}

export function TawkTo() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

    if (!propertyId || !widgetId) return;

    // Prevent double-injection
    if (document.getElementById('tawkto-script')) return;

    window.Tawk_API = window.Tawk_API || {};

    // Callbacks must be registered before the embed loads
    window.Tawk_API.onLoad = () => {
      loaded = true;
      if (bubbleHidden) window.Tawk_API?.hideWidget?.();
    };
    // Closing the chat on an app screen shouldn't leave the bubble behind
    window.Tawk_API.onChatMinimized = () => {
      if (bubbleHidden) window.Tawk_API?.hideWidget?.();
    };
    window.Tawk_API.onUnreadCountChanged = setUnreadCount;

    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawkto-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);
  }, []);

  // Update visitor attributes when auth state changes
  useEffect(() => {
    if (!window.Tawk_API) return;

    const name = profile?.full_name || '';
    const email = user?.email || '';

    if (!email) return;

    // If the widget is already loaded, set attributes immediately
    if (window.Tawk_API.setAttributes) {
      window.Tawk_API.setAttributes({ name, email });
    }

    // Also set for next load
    window.Tawk_API.visitor = { name, email };
  }, [user, profile]);

  return null;
}

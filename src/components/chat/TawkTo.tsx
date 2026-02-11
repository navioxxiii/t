'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

declare global {
  interface Window {
    Tawk_API?: {
      visitor?: { name?: string; email?: string };
      onLoad?: () => void;
      setAttributes?: (attrs: Record<string, string>, callback?: (error: unknown) => void) => void;
      maximize?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
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

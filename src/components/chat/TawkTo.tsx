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

    window.Tawk_API.onLoad = function () {
      if (window.innerWidth >= 768) return; // desktop: leave default position

      const container = document.querySelector<HTMLElement>('.tawk-min-container');
      if (!container) return;

      const iframe = container.querySelector<HTMLElement>('iframe');

      // Restore saved position, or default to above the bottom nav
      const saved = JSON.parse(localStorage.getItem('tawk-widget-pos') || 'null') as
        | { bottom: string; right: string }
        | null;
      if (saved) {
        container.style.bottom = saved.bottom;
        container.style.right = saved.right;
      } else {
        container.style.bottom = 'calc(72px + env(safe-area-inset-bottom, 0px))';
        container.style.right = '16px';
      }

      let startTouch = { x: 0, y: 0 };
      let startPos = { bottom: 0, right: 0 };
      let dragging = false;

      container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startTouch = { x: touch.clientX, y: touch.clientY };
        const rect = container.getBoundingClientRect();
        startPos = {
          bottom: window.innerHeight - rect.bottom,
          right: window.innerWidth - rect.right,
        };
        dragging = true;
        if (iframe) iframe.style.pointerEvents = 'none';
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startTouch.x;
        const dy = touch.clientY - startTouch.y;
        const newBottom = Math.max(0, startPos.bottom - dy);
        const newRight = Math.max(0, startPos.right - dx);
        container.style.bottom = `${newBottom}px`;
        container.style.right = `${newRight}px`;
      }, { passive: true });

      container.addEventListener('touchend', () => {
        dragging = false;
        if (iframe) iframe.style.pointerEvents = '';
        localStorage.setItem('tawk-widget-pos', JSON.stringify({
          bottom: container.style.bottom,
          right: container.style.right,
        }));
      });
    };

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

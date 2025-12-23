/**
 * useVirtualViewport Hook
 * Sets CSS custom properties based on the visual viewport to handle mobile keyboard issues.
 */

'use client';

import { useEffect } from 'react';

export function useVirtualViewport() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const setViewportProperties = () => {
        if (!window.visualViewport) return; // Add null check
        const { width, height, offsetTop, offsetLeft } = window.visualViewport;
        const root = document.documentElement;
        root.style.setProperty('--vh', `${height / 100}px`);
        root.style.setProperty('--vw', `${width / 100}px`);
        root.style.setProperty('--keyboard-height', `${window.innerHeight - height}px`);
        root.style.setProperty('--viewport-y', `${offsetTop}px`);
        root.style.setProperty('--viewport-x', `${offsetLeft}px`);
      };

      setViewportProperties();

      // Only listen to resize - scroll events are unnecessary for viewport tracking
      // and cause performance overhead on every scroll interaction
      window.visualViewport.addEventListener('resize', setViewportProperties);

      return () => {
        if (window.visualViewport) { // Add null check here
          window.visualViewport.removeEventListener('resize', setViewportProperties);
        }
      };
    }
  }, []);
}

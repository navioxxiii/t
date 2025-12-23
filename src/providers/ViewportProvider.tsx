/**
 * ViewportProvider Component
 * A client component that uses the useVirtualViewport hook to set CSS custom properties.
 */

'use client';

import { useVirtualViewport } from '@/hooks/useVirtualViewport';

export function ViewportProvider() {
  useVirtualViewport();
  return null;
}

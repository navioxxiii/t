/**
 * Dynamic PWA Manifest
 * Generated from centralized branding configuration
 */

import { MetadataRoute } from 'next';
import { branding } from '@/config/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: branding.name.full,
    short_name: branding.name.short,
    description: branding.description.short,
    start_url: branding.urls.startUrl,
    display: branding.pwa.display,
    background_color: branding.colors.background,
    theme_color: branding.colors.primary,
    orientation: branding.pwa.orientation,
    scope: branding.urls.scope,
    icons: [
      {
        src: '/icons/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: [...branding.pwa.categories],
  };
}

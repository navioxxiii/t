/**
 * MediaAsset Component
 * Intelligent component that handles both static images and animated assets
 * Automatically detects file type and renders appropriately
 *
 * Features:
 * - Static images: Uses Next.js Image for optimization
 * - Videos: Auto-plays looping videos (MP4/WebM)
 * - GIFs: Displays animated GIFs
 * - Lazy loading support
 * - Responsive sizing
 *
 * Usage:
 * <MediaAsset src="/images/hero-mockup.png" alt="App mockup" />
 *
 * Future upgrade path:
 * Just replace .png with .mp4/.webm/.gif - no code changes needed!
 */

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MediaAssetProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function MediaAsset({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
}: MediaAssetProps) {
  // Detect media type from file extension during render (not in useEffect)
  const extension = src.split('.').pop()?.toLowerCase();
  const mediaType = extension === 'mp4' || extension === 'webm'
    ? 'video'
    : extension === 'gif'
    ? 'gif'
    : 'image';

  // Video element for MP4/WebM
  if (mediaType === 'video') {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={cn('w-full h-auto', className)}
        aria-label={alt}
      >
        <source src={src} type={`video/${src.endsWith('.webm') ? 'webm' : 'mp4'}`} />
        {/* Fallback for browsers that don't support video */}
        <p className="text-text-secondary text-center py-8">{alt}</p>
      </video>
    );
  }

  // For GIFs and static images, use Next.js Image component
  // GIFs will animate automatically, static images get optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 1200}
      height={height || 675}
      className={cn('w-full h-auto', className)}
      priority={priority}
      unoptimized={mediaType === 'gif'} // Don't optimize GIFs (breaks animation)
    />
  );
}

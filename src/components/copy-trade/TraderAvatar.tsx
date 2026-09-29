/**
 * TraderAvatar Component
 * Trader image with an initials fallback when the image is missing or fails to load
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TraderAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function TraderAvatar({ name, src, className }: TraderAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+|(?=[A-Z])/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden bg-brand-primary/15 flex items-center justify-center',
        className
      )}
    >
      {src && !failed ? (
        <Image src={src} alt={name} fill className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="text-sm font-bold text-brand-primary">{initials}</span>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ArrowLeftRight, Clock, Settings, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/utils/haptics';
import { ServicesDialog } from './ServicesDialog';

interface BottomNavProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Wallet',   href: '/dashboard', icon: Wallet },
  { label: 'Swap',     href: '/swap',      icon: ArrowLeftRight },
  { label: 'Services', href: null,         icon: LayoutGrid, isCenter: true },
  { label: 'Activity', href: '/activity',  icon: Clock },
  { label: 'Settings', href: '/settings',  icon: Settings },
];

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const [servicesOpen, setServicesOpen] = useState(false);

  // Find active tab index (excluding center button)
  const activeIndex = navItems.findIndex((item) => item.href && item.href === pathname);
  const hasActiveTab = activeIndex !== -1;

  // Calculate indicator position (accounting for center button)
  const getIndicatorPosition = () => {
    if (!hasActiveTab) return '0%';

    // Adjust index for indicator positioning
    let adjustedIndex = activeIndex;
    if (activeIndex > 2) {
      // If item is after center button, shift left slightly
      adjustedIndex = activeIndex;
    }

    return `${(adjustedIndex / navItems.length) * 100}%`;
  };

  const indicatorLeft = getIndicatorPosition();
  const indicatorWidth = `${100 / navItems.length}%`;

  return (
    <div className={cn('w-full', className)}>
      <nav
         className={cn(
          // 1. Fixed to viewport bottom with safe-area support - floating 8px above
          'fixed inset-x-0 bottom-0 z-[100] pb-safe transform-gpu',
          // 2. Height
          'h-16 md:h-20',
          // 3. Visuals
          'border-t border-bg-tertiary bg-bg-secondary/95 backdrop-blur-lg shadow-2xl',
          'supports-backdrop-filter:bg-bg-secondary/80'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-4xl relative">
          <div className="relative grid grid-cols-5 h-16 md:h-20 items-center px-2 md:px-4">
            {/* Animated Active Indicator */}
            {hasActiveTab && (
              <div
                className="absolute top-0 h-0.5 md:h-1 flex items-center justify-center transition-all duration-300 ease-out pointer-events-none"
                style={{ left: indicatorLeft, width: indicatorWidth }}
                aria-hidden="true"
              >
                <div className="h-0.5 md:h-1 w-12 md:w-16 rounded-full bg-brand-primary shadow-glow" />
              </div>
            )}

            {/* ─── Nav items ─── */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href && pathname === item.href;

              // Center button (elevated Services button)
              if (item.isCenter) {
                return (
                  <div key={item.label} className="relative -mt-2 md:-mt-3">
                <button
                  onClick={() => {
                    haptics.selection();
                    setServicesOpen((servicesOpen) => !servicesOpen);
                  }}
                  aria-label="Services"
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 -translate-y-1/2',
                    'w-14 h-14 md:w-16 md:h-16',
                    'rounded-full bg-brand-primary',
                    'shadow-2xl shadow-brand-primary/40',
                    'ring-4 ring-bg-secondary',
                    'flex items-center justify-center',
                    'hover:scale-110 active:scale-95',
                    'transition-all duration-200 z-10'
                  )}
                >
                  <LayoutGrid className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </button>
              </div>
                );
              }

              // Regular nav items
              if (!item.href) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => !isActive && haptics.selection()}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 md:gap-1.5 rounded-lg px-3 md:px-5 py-2 md:py-3 transition-all duration-200 min-h-11',
                    'hover:bg-bg-tertiary/50 active:scale-95',
                    isActive && 'hover:bg-bg-tertiary/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 md:h-6 md:w-6 transition-all duration-200',
                      isActive ? 'text-brand-primary stroke-[2.5]' : 'text-text-secondary'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] md:text-xs font-medium transition-all duration-200',
                      isActive ? 'text-brand-primary' : 'text-text-tertiary'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Services Dialog */}
      <ServicesDialog open={servicesOpen} onOpenChange={setServicesOpen} />
    </div>
  );
}

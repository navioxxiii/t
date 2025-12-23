/**
 * Dashboard Header Component
 * Dynamic header that adapts based on current route
 */

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from './UserMenu';
import { branding } from '@/config/branding';
import { haptics } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { TokenPreferencesDialog } from '@/components/dashboard/TokenPreferencesDialog';

const routeTitles: Record<string, string> = {
  '/dashboard': branding.name.short,
  '/activity': 'Activity',
  '/swap': 'Swap',
  '/settings': 'Settings',
  '/earn': 'Earn',
  '/copy-trade': 'Copy Trade',
  '/kyc': 'KYC Verification',
};

interface DashboardHeaderProps {
  className?: string;
  onSupportClick?: () => void;
}

// Define parent routes for smart navigation
const routeParents: Record<string, string> = {};

export function DashboardHeader({ className, onSupportClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useChatStore((state) => state.unreadCount);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Determine title based on current route
  let title = routeTitles[pathname];

  if (!title) {
    // Handle dynamic routes like /earn/[id] or /copy-trade/[id]
    if (pathname.startsWith('/earn/')) {
      title = 'Vault Details';
    } else if (pathname.startsWith('/copy-trade/')) {
      title = 'Trader Details';
    } else {
      title = branding.name.short;
    }
  }

  const showBackButton = pathname !== '/dashboard';

  const handleBackClick = () => {
    haptics.light();

    // Smart navigation based on context
    if (pathname.startsWith('/earn/') && pathname !== '/earn') {
      // From vault detail or portfolio -> go to main earn page
      router.push('/earn');
    } else if (pathname.startsWith('/copy-trade/') && pathname !== '/copy-trade') {
      // From trader detail -> go to main copy-trade page
      router.push('/copy-trade');
    } else if (routeParents[pathname]) {
      // Use defined parent route
      router.push(routeParents[pathname]);
    } else {
      // Default: go to dashboard
      router.push('/dashboard');
    }
  };

  return (
    <header className={cn("fixed w-full top-0 z-[100] border-b border-bg-tertiary bg-bg-secondary/95 backdrop-blur supports-backdrop-filter:bg-bg-secondary/80 transform-gpu", className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-safe">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="hover:bg-bg-tertiary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <h1 className="text-xl font-bold text-text-primary">{title}</h1>
            )}
          </div>

          {/* Center - Title for pages with back button */}
          {showBackButton && (
            <h1 className="text-xl font-bold text-text-primary absolute left-1/2 -translate-x-1/2">
              {title}
            </h1>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Token preferences button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.light();
                setPreferencesOpen(true);
              }}
              className="hover:bg-bg-tertiary"
              aria-label="Token preferences"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>

            {/* Support button - mobile only */}
            {onSupportClick && (
              <button
                onClick={() => {
                  haptics.light();
                  onSupportClick();
                }}
                className="md:hidden relative w-10 h-10 rounded-full bg-bg-tertiary hover:bg-brand-primary/10 flex items-center justify-center transition-colors"
                aria-label="Open support chat"
              >
                <MessageCircle className="w-5 h-5 text-text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Token Preferences Dialog */}
      <TokenPreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </header>
  );
}

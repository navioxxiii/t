/**
 * User Menu Component
 * Displays user profile and account actions
 */

'use client';

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Lock, Wallet, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { haptics } from '@/lib/utils/haptics';
import { useState } from 'react';

export default function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const forceLogout = useAuthStore((state) => state.forceLogout);
  const loading = useAuthStore((state) => state.loading);
  const hasPinSetup = useAuthStore((state) => state.hasPinSetup);
  const lockApp = useAuthStore((state) => state.lockApp);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-bg-tertiary" />
    );
  }

  if (!user) {
    return null;
  }

  // Get user's first initial
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 'U';

  const handleProfileSettings = () => {
    haptics.light();
    router.push('/settings');
  };

  const handleLockApp = () => {
    haptics.light();
    lockApp();
  };

  const handleSignOut = async () => {
    haptics.light();
    setIsLoggingOut(true);

    // Timeout fallback - if signOut takes too long, force logout
    const timeout = setTimeout(() => {
      forceLogout();
    }, 5000);

    try {
      await signOut();
    } catch {
      forceLogout();
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
        >
          <span className="text-sm font-semibold text-brand-primary">
            {userInitial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.email}
            </p>
            {profile?.role && (
              <p className="text-xs text-text-tertiary capitalize">
                {profile.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleProfileSettings}
          className="gap-2 cursor-pointer transition-colors hover:bg-accent"
        >
          <User className="h-4 w-4 text-text-secondary" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleProfileSettings}
          className="gap-2 cursor-pointer transition-colors hover:bg-accent"
        >
          <Wallet className="h-4 w-4 text-text-secondary" />
          <span>Wallet Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hasPinSetup && (
          <DropdownMenuItem
            onClick={handleLockApp}
            className="gap-2 cursor-pointer transition-colors hover:bg-accent"
          >
            <Lock className="h-4 w-4 text-text-secondary" />
            <span>Lock App</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="gap-2 cursor-pointer transition-colors hover:bg-accent text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

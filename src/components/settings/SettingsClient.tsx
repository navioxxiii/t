'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Mail,
  Calendar,
  ShieldCheck,
  Loader2,
  Download,
  Headset,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';
import { SecuritySettingsDialog } from './SecuritySettingsDialog';
import { NotificationSettingsDialog } from './NotificationSettingsDialog';
import { IOSInstallGuide } from '@/components/pwa/IOSInstallGuide';
import { promptInstall, useInstallPlatform } from '@/lib/pwa/install';
import { branding } from '@/config/branding';
import { TraderAvatar } from '@/components/copy-trade/TraderAvatar';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { openSupportChat } from '@/components/chat/TawkTo';

interface SettingsItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}

function SettingsItem({
  icon: Icon,
  label,
  value,
  badge,
  onClick,
  destructive = false,
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-accent"
    >
      <Icon
        className={`h-5 w-5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`}
      />
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className={`font-medium ${destructive ? 'text-destructive' : ''}`}>
            {label}
          </p>
          {badge}
        </div>
        {value && (
          <p className="text-sm text-muted-foreground mt-0.5">{value}</p>
        )}
      </div>
      <ChevronRight
        className={`h-5 w-5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`}
      />
    </button>
  );
}

export default function SettingsClient() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const silentRefreshProfile = useAuthStore((state) => state.silentRefreshProfile);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [iosInstallOpen, setIosInstallOpen] = useState(false);
  // Only offered where this browser can actually install; ignores the banner's pacing
  const installPlatform = useInstallPlatform();
  const displayName = profile?.full_name || 'User';

  const handleLogout = async () => {
    setLogoutConfirmOpen(false);
    setIsLoggingOut(true);
    try {
      // signOut() already handles redirect via window.location.href
      await signOut();
      // Toast will show briefly before redirect
      toast.success('Logging out...', { duration: 1000 });
      // No router.push needed - signOut handles redirect
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed - trying force logout');
      setIsLoggingOut(false);
      // Force logout anyway as fallback
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('Force logout failed:', fallbackError);
      }
    }
  };

  // Refresh the stored profile so the new values show everywhere, not just here
  const syncProfile = () => {
    if (user) void silentRefreshProfile(user.id, user.email);
  };

  const idleMinutes = profile?.security_preferences?.idle_timeout_minutes ?? 5;
  const securitySummary = idleMinutes === 0 ? 'Auto-lock off' : `Auto-lock after ${idleMinutes} min`;

  const notificationPrefs = profile?.notification_preferences;
  const notificationSummary = notificationPrefs
    ? `${Object.values(notificationPrefs).filter(Boolean).length} of ${Object.keys(notificationPrefs).length} email alerts on`
    : 'Manage notification preferences';

  const memberSince = user?.created_at
    ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
    : '';

  const getKYCStatusBadge = () => {
    const status = profile?.kyc_status || 'not_started';

    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-action-green/10 text-action-green border-action-green/30 text-xs">
            Verified
          </Badge>
        );
      case 'pending':
      case 'under_review':
        return (
          <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-xs">
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-action-red/10 text-action-red border-action-red/30 text-xs">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-bg-tertiary text-text-secondary border-bg-tertiary text-xs">
            Not Started
          </Badge>
        );
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        {/* Profile - tap to edit */}
        <Card className="py-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setProfileDialogOpen(true)}
            className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent"
            aria-label="Edit profile"
          >
            <TraderAvatar name={displayName} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 min-w-0">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
              {memberSince && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Member {memberSince}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>
        </Card>

        {/* Account */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Account</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={ShieldCheck}
              label="Identity Verification"
              value="Verification status and transaction limits"
              badge={getKYCStatusBadge()}
              onClick={() => router.push('/settings/kyc')}
            />
            <SettingsItem
              icon={Shield}
              label="Security"
              value={`PIN, device unlock · ${securitySummary}`}
              onClick={() => setSecurityDialogOpen(true)}
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Preferences</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={Bell}
              label="Notifications"
              value={notificationSummary}
              onClick={() => setNotificationDialogOpen(true)}
            />
            {installPlatform && (
              <SettingsItem
                icon={Download}
                label="Install app"
                value={`Add ${branding.name.short} to your home screen`}
                onClick={() => (installPlatform === 'ios' ? setIosInstallOpen(true) : promptInstall())}
              />
            )}
          </div>
        </Card>

        {/* Help & legal */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Help &amp; legal</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={Headset}
              label="Contact support"
              value="Chat with our team"
              onClick={openSupportChat}
            />
            <SettingsItem
              icon={FileText}
              label="Terms of Service"
              onClick={() => router.push('/terms-of-service')}
            />
          </div>
        </Card>

        {/* Log out */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="divide-y divide-border">
            <SettingsItem
              icon={isLoggingOut ? Loader2 : LogOut}
              label={isLoggingOut ? 'Logging out...' : 'Log Out'}
              onClick={() => setLogoutConfirmOpen(true)}
              destructive
            />
          </div>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>{branding.name.legal}</p>
          <p className="mt-1">{branding.name.copyright}</p>
        </div>

      {/* Dialogs */}
      <ProfileSettingsDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        currentName={displayName}
        email={user?.email || ''}
        onSuccess={syncProfile}
      />

      <SecuritySettingsDialog
        open={securityDialogOpen}
        onOpenChange={setSecurityDialogOpen}
      />

      <NotificationSettingsDialog
        open={notificationDialogOpen}
        onOpenChange={(open) => {
          setNotificationDialogOpen(open);
          // The dialog saves via the API but doesn't update the store
          if (!open) syncProfile();
        }}
      />

      <ConfirmActionDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={handleLogout}
        title={`Log out of ${branding.name.short}?`}
        description="You'll need your email and password to sign in again."
        confirmText="Log Out"
        variant="destructive"
        loading={isLoggingOut}
      />

      <IOSInstallGuide open={iosInstallOpen} onOpenChange={setIosInstallOpen} />
    </div>
  );
}

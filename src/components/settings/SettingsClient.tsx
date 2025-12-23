'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Mail,
  Calendar,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';
import { SecuritySettingsDialog } from './SecuritySettingsDialog';
import { NotificationSettingsDialog } from './NotificationSettingsDialog';
import { AppearanceSettingsDialog } from './AppearanceSettingsDialog';
import { branding } from '@/config/branding';

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
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [appearanceDialogOpen, setAppearanceDialogOpen] = useState(false);
  const [currentName, setCurrentName] = useState(profile?.full_name || 'User');

  const handleLogout = async () => {
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

  const handleProfileUpdate = (newName: string) => {
    setCurrentName(newName);
  };

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
        {/* Profile Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {currentName}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </p>
                {memberSince && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Member {memberSince}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Account</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={User}
              label="Profile Settings"
              value="Manage your profile information"
              onClick={() => setProfileDialogOpen(true)}
            />
            <SettingsItem
              icon={ShieldCheck}
              label="Identity Verification"
              value="KYC status and transaction limits"
              badge={getKYCStatusBadge()}
              onClick={() => router.push('/settings/kyc')}
            />
            <SettingsItem
              icon={Shield}
              label="Security"
              value="Password and authentication"
              onClick={() => setSecurityDialogOpen(true)}
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Preferences</h3>
          </div>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={Bell}
              label="Notifications"
              value="Manage notification preferences"
              onClick={() => setNotificationDialogOpen(true)}
            />
            <SettingsItem
              icon={Palette}
              label="Appearance"
              value="Theme and display settings"
              onClick={() => setAppearanceDialogOpen(true)}
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <div className="divide-y divide-border">
            <SettingsItem
              icon={isLoggingOut ? Loader2 : LogOut}
              label={isLoggingOut ? "Logging out..." : "Log Out"}
              onClick={handleLogout}
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
        currentName={currentName}
        email={user?.email || ''}
        onSuccess={handleProfileUpdate}
      />

      <SecuritySettingsDialog
        open={securityDialogOpen}
        onOpenChange={setSecurityDialogOpen}
      />

      <NotificationSettingsDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
      />

      <AppearanceSettingsDialog
        open={appearanceDialogOpen}
        onOpenChange={setAppearanceDialogOpen}
      />
    </div>
  );
}

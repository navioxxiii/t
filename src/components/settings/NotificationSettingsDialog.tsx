'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, ArrowDownUp, Shield, Loader2 } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationSettings {
  email_deposits: boolean;
  email_withdrawals: boolean;
  email_swaps: boolean;
  email_security: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_deposits: true,
  email_withdrawals: true,
  email_swaps: true,
  email_security: true,
};

export function NotificationSettingsDialog({
  open,
  onOpenChange,
}: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/profile/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      const data = await response.json();
      setSettings(data.settings || DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      toast.error('Failed to load notification preferences');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };

    // Optimistic update
    setSettings(newSettings);
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert on error
      setSettings(settings);
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const notificationOptions = [
    {
      key: 'email_deposits' as keyof NotificationSettings,
      icon: <Mail className="h-5 w-5" />,
      label: 'Deposit Notifications',
      description: 'Get notified when you receive deposits',
    },
    {
      key: 'email_withdrawals' as keyof NotificationSettings,
      icon: <Bell className="h-5 w-5" />,
      label: 'Withdrawal Notifications',
      description: 'Get notified about withdrawal status changes',
    },
    {
      key: 'email_swaps' as keyof NotificationSettings,
      icon: <ArrowDownUp className="h-5 w-5" />,
      label: 'Swap Confirmations',
      description: 'Get notified when swaps are completed',
    },
    {
      key: 'email_security' as keyof NotificationSettings,
      icon: <Shield className="h-5 w-5" />,
      label: 'Security Alerts',
      description: 'Get notified about security-related activities',
    },
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Notification Preferences</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Manage how you receive notifications
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4 px-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              <span className="ml-2 text-sm text-text-tertiary">Loading preferences...</span>
            </div>
          ) : (
            <>
              {notificationOptions.map((option) => (
                <div
                  key={option.key}
                  className="rounded-lg p-4 hover:bg-bg-tertiary transition-colors space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-text-secondary">{option.icon}</div>
                    <Label htmlFor={option.key} className="flex-1 cursor-pointer">
                      <p className="font-semibold text-text-primary">
                        {option.label}
                      </p>
                    </Label>
                    <Switch
                      id={option.key}
                      checked={settings[option.key]}
                      onCheckedChange={() => handleToggle(option.key)}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-sm text-text-tertiary pl-8">
                    {option.description}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-2 px-4">
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
            <span className="ml-2 text-sm text-text-tertiary">Saving...</span>
          </div>
        )}
        <div className="pb-6"></div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

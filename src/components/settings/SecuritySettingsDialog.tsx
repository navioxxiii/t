'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Fingerprint, Shield, Lock, Clock, Loader2, AlertTriangle } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeviceAuthSetup } from '@/components/security/DeviceAuthSetup';
import { ChangePinDialog } from '@/components/security/ChangePinDialog';
import { ChangePasswordDialog } from '@/components/security/ChangePasswordDialog';
import { toast } from 'sonner';

interface SecuritySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySettingsDialog({
  open,
  onOpenChange,
}: SecuritySettingsDialogProps) {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [showDeviceAuthSetup, setShowDeviceAuthSetup] = useState(false);
  const [showChangePinDialog, setShowChangePinDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [isUpdatingTimeout, setIsUpdatingTimeout] = useState(false);

  // Get device auth status from profile
  const deviceAuthEnabled = profile?.security_preferences?.device_auth_enabled || false;

  // Get current idle timeout (default 5 minutes)
  const currentIdleTimeout = profile?.security_preferences?.idle_timeout_minutes ?? 5;

  const handleTimeoutChange = async (value: string) => {
    const newTimeout = parseInt(value, 10);
    setIsUpdatingTimeout(true);

    try {
      const response = await fetch('/api/security/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idle_timeout_minutes: newTimeout }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      await refreshProfile();
      toast.success('Auto-lock timeout updated');
    } catch (error) {
      console.error('Failed to update timeout:', error);
      toast.error('Failed to update timeout');
    } finally {
      setIsUpdatingTimeout(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Security Settings</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Manage your security preferences and authentication methods
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="px-4">
          <div className="space-y-6 py-4">
            {/* PIN Management Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PIN Code
                </h3>
                <p className="text-xs text-text-tertiary mt-1">
                  Change your 4-digit PIN used for transaction authentication
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Transaction PIN</div>
                  <div className="text-xs text-text-tertiary">
                    {profile?.last_pin_change_at
                      ? `Last changed: ${new Date(profile.last_pin_change_at).toLocaleDateString()}`
                      : 'Set during initial setup'}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePinDialog(true)}
                >
                  Change PIN
                </Button>
              </div>
            </div>

            <Separator />

            {/* Device Authentication Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Device Authentication
                </h3>
                <p className="text-xs text-text-tertiary mt-1">
                  Use biometrics (Face ID, Touch ID, Windows Hello) to unlock the app
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Biometric Unlock</div>
                  <div className="text-xs text-text-tertiary">
                    {deviceAuthEnabled ? 'Enabled' : 'Not configured'}
                  </div>
                </div>
                <Button
                  type="button"
                  variant={deviceAuthEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setShowDeviceAuthSetup(true)}
                >
                  {deviceAuthEnabled ? 'Reconfigure' : 'Enable'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Auto-Lock Timeout Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Auto-Lock
                </h3>
                <p className="text-xs text-text-tertiary mt-1">
                  Lock the app after a period of inactivity
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Lock After</div>
                  <div className="text-xs text-text-tertiary">
                    App locks when inactive or backgrounded
                  </div>
                </div>
                <Select
                  value={currentIdleTimeout.toString()}
                  onValueChange={handleTimeoutChange}
                  disabled={isUpdatingTimeout}
                >
                  <SelectTrigger className="w-32">
                    {isUpdatingTimeout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentIdleTimeout === 0 && (
                <p className="flex items-center text-xs text-yellow-600 dark:text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Disabling auto-lock is not recommended for security reasons
                </p>
              )}
            </div>

            <Separator />

            {/* Account Password Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Account Password
                </h3>
                <p className="text-xs text-text-tertiary mt-1">
                  Change your account password for signing in
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Login Password</div>
                  <div className="text-xs text-text-tertiary">
                    Set during registration
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>

      {/* Device Auth Setup Dialog */}
      <DeviceAuthSetup
        open={showDeviceAuthSetup}
        onOpenChange={setShowDeviceAuthSetup}
        onSuccess={() => {
          refreshProfile();
          toast.success('Device authentication configured successfully');
        }}
      />

      {/* Change PIN Dialog */}
      <ChangePinDialog
        open={showChangePinDialog}
        onOpenChange={setShowChangePinDialog}
        onSuccess={() => {
          refreshProfile();
        }}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        onSuccess={() => {
          refreshProfile();
        }}
      />
    </ResponsiveDialog>
  );
}

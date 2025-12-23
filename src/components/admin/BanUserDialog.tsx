/**
 * Ban User Dialog
 * Allow admins to ban/unban users with reason
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBanUser, UserProfile } from '@/hooks/useAdminUsers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Ban, CheckCircle } from 'lucide-react';

interface BanUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({
  user,
  open,
  onOpenChange,
}: BanUserDialogProps) {
  const [reason, setReason] = useState('');
  const banUser = useBanUser();

  const handleSubmit = () => {
    if (!user) return;

    const isBanning = !user.is_banned;

    if (isBanning && !reason.trim()) {
      return; // Require reason for banning
    }

    banUser.mutate(
      {
        userId: user.id,
        is_banned: isBanning,
        reason: isBanning ? reason : undefined,
      },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      }
    );
  };

  if (!user) return null;

  const isBanned = user.is_banned;
  const actionText = isBanned ? 'Unban' : 'Ban';
  const actionColor = isBanned ? 'green' : 'red';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{actionText} User</DialogTitle>
          <DialogDescription>
            {isBanned
              ? `Restore access for ${user.email}`
              : `Suspend access for ${user.email}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
            {isBanned ? (
              <>
                <div className="h-10 w-10 rounded-full bg-action-red/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-action-red" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-action-red">
                    Currently Banned
                  </div>
                  <div className="text-sm text-text-tertiary">
                    Since:{' '}
                    {user.banned_at
                      ? new Date(user.banned_at).toLocaleDateString()
                      : 'Unknown'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-action-green/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-action-green" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-action-green">
                    Active User
                  </div>
                  <div className="text-sm text-text-tertiary">
                    Has full access
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Previous Ban Reason (if unbanning) */}
          {isBanned && user.banned_reason && (
            <div className="space-y-2">
              <Label className="text-text-primary">Previous Ban Reason</Label>
              <div className="p-3 bg-action-red/10 border border-action-red/20 rounded-lg">
                <p className="text-sm text-action-red">
                  {user.banned_reason}
                </p>
              </div>
            </div>
          )}

          {/* Ban Reason Input (if banning) */}
          {!isBanned && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-text-primary">
                Ban Reason <span className="text-action-red">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Violated terms of service, suspicious activity, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={
                  reason.trim()
                    ? ''
                    : 'border-action-red/30 focus:border-action-red focus:ring-action-red'
                }
              />
              <p className="text-sm text-text-tertiary">
                This reason will be shown to the user when they try to log in.
              </p>
            </div>
          )}

          {/* Warning */}
          <Alert variant={isBanned ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isBanned ? (
                <>
                  Unbanning this user will immediately restore their access to
                  the platform.
                </>
              ) : (
                <>
                  Banning this user will immediately revoke their access. They
                  will be logged out and unable to log back in.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
            disabled={banUser.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isBanned ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={
              banUser.isPending || (!isBanned && !reason.trim())
            }
          >
            {banUser.isPending
              ? `${actionText}ning...`
              : `${actionText} User`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

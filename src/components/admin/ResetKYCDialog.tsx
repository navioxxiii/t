/**
 * Reset KYC Dialog - Reset user's KYC status to allow re-submission
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserProfile } from '@/hooks/useAdminUsers';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ResetKYCDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetKYCDialog({ user, open, onOpenChange }: ResetKYCDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/reset-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('KYC reset successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        onOpenChange(false);
        setReason('');
      } else {
        toast.error(data.error || 'Failed to reset KYC');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reset KYC
          </DialogTitle>
          <DialogDescription>
            Reset this user's KYC status to allow re-submission
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reset Information</p>
                  <p className="text-sm text-text-secondary">
                    This will reset the user's KYC status to "none" and clear verification data.
                    The user will be able to submit KYC documents again.
                  </p>
                  <p className="text-sm text-text-secondary mt-2">
                    User: {user.email}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Current KYC Status: {user.kyc_status || 'none'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for KYC Reset *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., User submitted incorrect documents and needs to resubmit"
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? 'Processing...' : 'Reset KYC'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

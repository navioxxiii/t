/**
 * Verify Email Dialog - Manually mark user's email as verified
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
import { Mail, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface VerifyEmailDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifyEmailDialog({ user, open, onOpenChange }: VerifyEmailDialogProps) {
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
      const response = await fetch('/api/admin/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Email verified successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        onOpenChange(false);
        setReason('');
      } else {
        toast.error(data.error || 'Failed to verify email');
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
            <Mail className="h-5 w-5" />
            Verify Email
          </DialogTitle>
          <DialogDescription>
            Manually mark this user's email as verified
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">User Information</p>
                  <p className="text-sm text-text-secondary">Email: {user.email}</p>
                  <p className="text-sm text-text-secondary">
                    Current Status: {user.email_verified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for Manual Verification *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Support ticket #12345 - user's email provider blocked verification emails"
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Verify Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

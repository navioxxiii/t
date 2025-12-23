/**
 * Manual KYC Approval Dialog - Approve KYC without documents
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserProfile } from '@/hooks/useAdminUsers';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ManualKYCApprovalDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const kycTiers = [
  { value: 'tier_1_basic', label: 'Tier 1 - Basic' },
  { value: 'tier_2_advanced', label: 'Tier 2 - Advanced' },
];

export function ManualKYCApprovalDialog({ user, open, onOpenChange }: ManualKYCApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState('tier_1_basic');
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
      const response = await fetch('/api/admin/users/manual-kyc-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          tier,
          reason: reason.trim(),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        toast.error(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      if (response.ok) {
        toast.success('KYC approved successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        onOpenChange(false);
        setReason('');
        setTier('tier_1_basic');
      } else {
        toast.error(data.error || 'Failed to approve KYC');
      }
    } catch (error) {
      console.error('Manual KYC approval error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Manual KYC Approval
          </DialogTitle>
          <DialogDescription>
            Approve KYC for this user without requiring document verification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Warning</p>
                  <p className="text-sm text-text-secondary">
                    This will approve KYC without document verification. Use only for trusted users or special cases.
                  </p>
                  <p className="text-sm text-text-secondary mt-2">
                    User: {user.email}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Current Status: {user.kyc_status || 'not_started'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Current Tier: {user.kyc_tier || 'none'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>KYC Tier to Grant *</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {kycTiers.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for Manual Approval *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., VIP customer with verified identity through separate channel"
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Approve KYC'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

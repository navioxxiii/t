/**
 * Create KYC Limit Dialog Component
 * Form dialog for creating new KYC tier limits
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface CreateKYCLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKYCLimitDialog({ open, onOpenChange }: CreateKYCLimitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tier: 'tier_1_basic',
    daily_limit_usd: '1000',
    monthly_limit_usd: '10000',
    single_transaction_limit_usd: '500',
    can_deposit: true,
    can_withdraw: true,
    can_swap: true,
    can_send: true,
    can_earn: true,
    can_copy_trade: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    const dailyLimit = parseFloat(formData.daily_limit_usd);
    const monthlyLimit = parseFloat(formData.monthly_limit_usd);
    const singleTxLimit = parseFloat(formData.single_transaction_limit_usd);

    if (isNaN(dailyLimit) || dailyLimit < 0) {
      toast.error('Daily limit must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(monthlyLimit) || monthlyLimit < 0) {
      toast.error('Monthly limit must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(singleTxLimit) || singleTxLimit < 0) {
      toast.error('Single transaction limit must be a positive number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/kyc-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          daily_limit_usd: dailyLimit,
          monthly_limit_usd: monthlyLimit,
          single_transaction_limit_usd: singleTxLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create KYC limit');
        return;
      }

      toast.success('KYC limit created successfully!');

      // Reset form
      setFormData({
        tier: 'tier_1_basic',
        daily_limit_usd: '1000',
        monthly_limit_usd: '10000',
        single_transaction_limit_usd: '500',
        can_deposit: true,
        can_withdraw: true,
        can_swap: true,
        can_send: true,
        can_earn: true,
        can_copy_trade: false,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating KYC limit:', error);
      toast.error('An error occurred while creating the KYC limit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create KYC Tier Limits</DialogTitle>
          <DialogDescription>
            Configure transaction limits and feature permissions for a KYC tier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tier">
                KYC Tier <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="none">None (Unverified)</SelectItem>
                  <SelectItem value="tier_1_basic">Tier 1 - Basic</SelectItem>
                  <SelectItem value="tier_2_advanced">Tier 2 - Advanced</SelectItem>
                  <SelectItem value="tier_3_enhanced">Tier 3 - Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_limit_usd">Daily Limit (USD)</Label>
                <Input
                  id="daily_limit_usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.daily_limit_usd}
                  onChange={(e) => setFormData({ ...formData, daily_limit_usd: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_limit_usd">Monthly Limit (USD)</Label>
                <Input
                  id="monthly_limit_usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_limit_usd}
                  onChange={(e) => setFormData({ ...formData, monthly_limit_usd: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="single_transaction_limit_usd">Single TX Limit (USD)</Label>
                <Input
                  id="single_transaction_limit_usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.single_transaction_limit_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, single_transaction_limit_usd: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Feature Permissions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_deposit">Deposit</Label>
                  <Switch
                    id="can_deposit"
                    checked={formData.can_deposit}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_deposit: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_withdraw">Withdraw</Label>
                  <Switch
                    id="can_withdraw"
                    checked={formData.can_withdraw}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_withdraw: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_swap">Swap</Label>
                  <Switch
                    id="can_swap"
                    checked={formData.can_swap}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_swap: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_send">Send</Label>
                  <Switch
                    id="can_send"
                    checked={formData.can_send}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_send: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_earn">Earn</Label>
                  <Switch
                    id="can_earn"
                    checked={formData.can_earn}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_earn: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_copy_trade">Copy Trade</Label>
                  <Switch
                    id="can_copy_trade"
                    checked={formData.can_copy_trade}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_copy_trade: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tier Limits'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Create Vault Dialog
 * Form to create new earn vault (super_admin only)
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
import { useCreateEarnVault } from '@/hooks/useAdminEarnVaults';
import { AlertCircle } from 'lucide-react';

interface CreateVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  title: string;
  subtitle: string;
  apy_percent: string;
  duration_months: string;
  min_amount: string;
  max_amount: string;
  total_capacity: string;
  risk_level: string;
  status: string;
}

export function CreateVaultDialog({
  open,
  onOpenChange,
}: CreateVaultDialogProps) {
  const createMutation = useCreateEarnVault();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    apy_percent: '',
    duration_months: '3',
    min_amount: '',
    max_amount: '',
    total_capacity: '',
    risk_level: 'low',
    status: 'active',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    const apy = parseFloat(formData.apy_percent);
    if (!formData.apy_percent || isNaN(apy) || apy <= 0 || apy > 100) {
      newErrors.apy_percent = 'APY must be between 0.1 and 100';
    }

    const minAmount = parseFloat(formData.min_amount);
    if (!formData.min_amount || isNaN(minAmount) || minAmount <= 0) {
      newErrors.min_amount = 'Minimum amount must be greater than 0';
    }

    if (formData.max_amount) {
      const maxAmount = parseFloat(formData.max_amount);
      if (isNaN(maxAmount) || maxAmount <= minAmount) {
        newErrors.max_amount = 'Max amount must be greater than min amount';
      }
    }

    if (formData.total_capacity) {
      const capacity = parseFloat(formData.total_capacity);
      if (isNaN(capacity) || capacity <= 0) {
        newErrors.total_capacity = 'Capacity must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    interface CreateVaultPayload {
      title: string;
      subtitle?: string;
      apy_percent: number;
      duration_months: number;
      min_amount: number;
      max_amount?: number;
      total_capacity?: number;
      risk_level: string;
      status: string;
    }

    const data: CreateVaultPayload = {
      title: formData.title.trim(),
      apy_percent: parseFloat(formData.apy_percent),
      duration_months: parseInt(formData.duration_months),
      min_amount: parseFloat(formData.min_amount),
      risk_level: formData.risk_level,
      status: formData.status,
    };

    if (formData.subtitle.trim()) {
      data.subtitle = formData.subtitle.trim();
    }

    if (formData.max_amount) {
      data.max_amount = parseFloat(formData.max_amount);
    }

    if (formData.total_capacity) {
      data.total_capacity = parseFloat(formData.total_capacity);
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setFormData({
          title: '',
          subtitle: '',
          apy_percent: '',
          duration_months: '3',
          min_amount: '',
          max_amount: '',
          total_capacity: '',
          risk_level: 'low',
          status: 'active',
        });
        setErrors({});
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Vault</DialogTitle>
          <DialogDescription>
            Add a new investment vault for users to invest in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-action-red">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Bitcoin Fixed Income"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {errors.title && (
              <p className="text-xs text-action-red">{errors.title}</p>
            )}
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
            <Input
              id="subtitle"
              placeholder="e.g., Secure your Bitcoin with guaranteed returns"
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* APY */}
            <div className="space-y-2">
              <Label htmlFor="apy">
                APY (%) <span className="text-action-red">*</span>
              </Label>
              <Input
                id="apy"
                type="number"
                step="0.01"
                min="0.1"
                max="100"
                placeholder="e.g., 8.5"
                value={formData.apy_percent}
                onChange={(e) => handleChange('apy_percent', e.target.value)}
              />
              {errors.apy_percent && (
                <p className="text-xs text-action-red">{errors.apy_percent}</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration <span className="text-action-red">*</span>
              </Label>
              <Select
                value={formData.duration_months}
                onValueChange={(value) => handleChange('duration_months', value)}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Amount */}
            <div className="space-y-2">
              <Label htmlFor="min_amount">
                Min Amount (USDT) <span className="text-action-red">*</span>
              </Label>
              <Input
                id="min_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 100"
                value={formData.min_amount}
                onChange={(e) => handleChange('min_amount', e.target.value)}
              />
              {errors.min_amount && (
                <p className="text-xs text-action-red">{errors.min_amount}</p>
              )}
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <Label htmlFor="max_amount">Max Amount (USDT)</Label>
              <Input
                id="max_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty for unlimited"
                value={formData.max_amount}
                onChange={(e) => handleChange('max_amount', e.target.value)}
              />
              {errors.max_amount && (
                <p className="text-xs text-action-red">{errors.max_amount}</p>
              )}
            </div>
          </div>

          {/* Total Capacity */}
          <div className="space-y-2">
            <Label htmlFor="total_capacity">Total Capacity (USDT)</Label>
            <Input
              id="total_capacity"
              type="number"
              step="0.01"
              min="0"
              placeholder="Leave empty for unlimited capacity"
              value={formData.total_capacity}
              onChange={(e) => handleChange('total_capacity', e.target.value)}
            />
            {errors.total_capacity && (
              <p className="text-xs text-action-red">{errors.total_capacity}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Risk Level */}
            <div className="space-y-2">
              <Label htmlFor="risk_level">
                Risk Level <span className="text-action-red">*</span>
              </Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => handleChange('risk_level', value)}
              >
                <SelectTrigger id="risk_level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Initial Status <span className="text-action-red">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="active">👁️ Active (Visible)</SelectItem>
                  <SelectItem value="sold_out">🚫 Sold Out (Hidden)</SelectItem>
                  <SelectItem value="ended">🚫 Ended (Hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-text-tertiary bg-bg-tertiary p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Fields marked with <span className="text-action-red">*</span> are required.
              Only super admins can create vaults.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Vault'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

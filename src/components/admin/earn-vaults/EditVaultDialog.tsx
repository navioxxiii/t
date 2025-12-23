/**
 * Edit Vault Dialog
 * Form to update existing vault with safety checks (super_admin only)
 */

'use client';

import { useState, useEffect } from 'react';
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
import { useUpdateEarnVault, useAdminEarnVault } from '@/hooks/useAdminEarnVaults';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface Vault {
  id: string;
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

interface EditVaultDialogProps {
  vault: Vault | null;
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
}

export function EditVaultDialog({
  vault,
  open,
  onOpenChange,
}: EditVaultDialogProps) {
  const updateMutation = useUpdateEarnVault();
  const { data: vaultDetails } = useAdminEarnVault(vault?.id || '');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    apy_percent: '',
    duration_months: '3',
    min_amount: '',
    max_amount: '',
    total_capacity: '',
    risk_level: 'low',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Check if vault has active positions
  const hasActivePositions = (vaultDetails?.stats?.active_positions || 0) > 0;

  // Update form when dialog opens
  useEffect(() => {
    if (open && vault) {
      setFormData({
        title: vault.title,
        subtitle: vault.subtitle || '',
        apy_percent: vault.apy_percent.toString(),
        duration_months: vault.duration_months.toString(),
        min_amount: vault.min_amount.toString(),
        max_amount: vault.max_amount?.toString() || '',
        total_capacity: vault.total_capacity?.toString() || '',
        risk_level: vault.risk_level,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!vault) return null;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    interface UpdateVaultPayload {
      title: string;
      subtitle?: string;
      apy_percent?: number;
      duration_months?: number;
      min_amount: number;
      max_amount?: number;
      total_capacity?: number;
      risk_level: string;
    }

    const data: UpdateVaultPayload = {
      title: formData.title.trim(),
      min_amount: parseFloat(formData.min_amount),
      risk_level: formData.risk_level,
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

    // Only include APY and duration if no active positions
    if (!hasActivePositions) {
      data.apy_percent = parseFloat(formData.apy_percent);
      data.duration_months = parseInt(formData.duration_months);
    }

    updateMutation.mutate(
      { vaultId: vault.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vault</DialogTitle>
          <DialogDescription>
            Update vault settings and configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasActivePositions && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  Active Positions Detected
                </h4>
                <p className="text-sm text-text-secondary">
                  This vault has {vaultDetails?.stats?.active_positions} active position(s).
                  APY and duration cannot be modified to protect existing investors.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit_title">
              Title <span className="text-action-red">*</span>
            </Label>
            <Input
              id="edit_title"
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
            <Label htmlFor="edit_subtitle">Subtitle (Optional)</Label>
            <Input
              id="edit_subtitle"
              placeholder="e.g., Secure your Bitcoin with guaranteed returns"
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* APY */}
            <div className="space-y-2">
              <Label htmlFor="edit_apy">
                APY (%) <span className="text-action-red">*</span>
              </Label>
              <Input
                id="edit_apy"
                type="number"
                step="0.01"
                min="0.1"
                max="100"
                placeholder="e.g., 8.5"
                value={formData.apy_percent}
                onChange={(e) => handleChange('apy_percent', e.target.value)}
                disabled={hasActivePositions}
              />
              {errors.apy_percent && (
                <p className="text-xs text-action-red">{errors.apy_percent}</p>
              )}
              {hasActivePositions && (
                <p className="text-xs text-yellow-500">
                  Locked due to active positions
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="edit_duration">
                Duration <span className="text-action-red">*</span>
              </Label>
              <Select
                value={formData.duration_months}
                onValueChange={(value) => handleChange('duration_months', value)}
                disabled={hasActivePositions}
              >
                <SelectTrigger id="edit_duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
              {hasActivePositions && (
                <p className="text-xs text-yellow-500">
                  Locked due to active positions
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit_min_amount">
                Min Amount (USDT) <span className="text-action-red">*</span>
              </Label>
              <Input
                id="edit_min_amount"
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
              <Label htmlFor="edit_max_amount">Max Amount (USDT)</Label>
              <Input
                id="edit_max_amount"
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
            <Label htmlFor="edit_total_capacity">Total Capacity (USDT)</Label>
            <Input
              id="edit_total_capacity"
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

          {/* Risk Level */}
          <div className="space-y-2">
            <Label htmlFor="edit_risk_level">
              Risk Level <span className="text-action-red">*</span>
            </Label>
            <Select
              value={formData.risk_level}
              onValueChange={(value) => handleChange('risk_level', value)}
            >
              <SelectTrigger id="edit_risk_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 text-xs text-text-tertiary bg-bg-tertiary p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              To change visibility status, use the &quot;Toggle Visibility&quot; action instead.
              Only super admins can edit vaults.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

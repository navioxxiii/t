/**
 * Create Trader Dialog Component
 * Form dialog for creating new copy trade traders
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
import { toast } from 'sonner';

interface CreateTraderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTraderDialog({ open, onOpenChange }: CreateTraderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
    strategy: '',
    risk_level: 'medium',
    aum_usdt: '0',
    max_copiers: '100',
    performance_fee_percent: '15',
    historical_roi_min: '0',
    historical_roi_max: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.strategy) {
      toast.error('Name and strategy are required');
      setLoading(false);
      return;
    }

    const aum = parseFloat(formData.aum_usdt);
    const maxCopiers = parseInt(formData.max_copiers);
    const feePercent = parseFloat(formData.performance_fee_percent);
    const roiMin = parseFloat(formData.historical_roi_min);
    const roiMax = parseFloat(formData.historical_roi_max);

    if (isNaN(aum) || aum < 0) {
      toast.error('AUM must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(maxCopiers) || maxCopiers < 1) {
      toast.error('Max copiers must be at least 1');
      setLoading(false);
      return;
    }

    if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error('Performance fee must be between 0 and 100');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/copy-trade/traders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          aum_usdt: aum,
          max_copiers: maxCopiers,
          performance_fee_percent: feePercent,
          historical_roi_min: roiMin,
          historical_roi_max: roiMax,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create trader');
        return;
      }

      toast.success('Trader created successfully!');

      // Reset form
      setFormData({
        name: '',
        avatar_url: '',
        strategy: '',
        risk_level: 'medium',
        aum_usdt: '0',
        max_copiers: '100',
        performance_fee_percent: '15',
        historical_roi_min: '0',
        historical_roi_max: '0',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating trader:', error);
      toast.error('An error occurred while creating the trader');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Copy Trade Trader</DialogTitle>
          <DialogDescription>
            Add a new trader to the copy trading platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Trader Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  placeholder="https://..."
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">
                  Strategy <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="strategy"
                  placeholder="Swing Trading, Day Trading, etc."
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_level">Risk Level</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aum_usdt">Initial AUM (USDT)</Label>
                <Input
                  id="aum_usdt"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.aum_usdt}
                  onChange={(e) => setFormData({ ...formData, aum_usdt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_copiers">Max Copiers</Label>
                <Input
                  id="max_copiers"
                  type="number"
                  min="1"
                  value={formData.max_copiers}
                  onChange={(e) => setFormData({ ...formData, max_copiers: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performance_fee_percent">Performance Fee (%)</Label>
                <Input
                  id="performance_fee_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.performance_fee_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, performance_fee_percent: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Historical ROI Range (%)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="historical_roi_min">Minimum ROI</Label>
                  <Input
                    id="historical_roi_min"
                    type="number"
                    step="0.01"
                    value={formData.historical_roi_min}
                    onChange={(e) =>
                      setFormData({ ...formData, historical_roi_min: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historical_roi_max">Maximum ROI</Label>
                  <Input
                    id="historical_roi_max"
                    type="number"
                    step="0.01"
                    value={formData.historical_roi_max}
                    onChange={(e) =>
                      setFormData({ ...formData, historical_roi_max: e.target.value })
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
              {loading ? 'Creating...' : 'Create Trader'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

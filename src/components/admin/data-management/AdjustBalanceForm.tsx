/**
 * Adjust Balance Form Component
 * Allows admin to manually adjust user balances to fix discrepancies or compensate users
 * Creates an audit trail of all balance adjustments
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export function AdjustBalanceForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_email: '',
    base_token_code: 'usdt',
    adjustment_amount: '',
    adjustment_type: 'add',
    reason: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.user_email || !formData.adjustment_amount || !formData.reason) {
      toast.error('User email, amount, and reason are required');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.adjustment_amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be a positive number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/data-management/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          adjustment_amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to adjust balance');
        return;
      }

      toast.success(`Balance adjusted successfully! New balance: ${data.new_balance}`);

      // Reset form
      setFormData({
        user_email: '',
        base_token_code: 'usdt',
        adjustment_amount: '',
        adjustment_type: 'add',
        reason: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('An error occurred while adjusting balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              Balance Adjustment Warning
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              This action will directly modify user balances. All adjustments are logged in the audit trail.
              Ensure you have proper authorization and documentation before proceeding.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user_email">
            User Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="user_email"
            type="email"
            placeholder="user@example.com"
            value={formData.user_email}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_token_code">Token</Label>
          <Select
            value={formData.base_token_code}
            onValueChange={(value) => setFormData({ ...formData, base_token_code: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usdt">USDT</SelectItem>
              <SelectItem value="usdc">USDC</SelectItem>
              <SelectItem value="btc">BTC</SelectItem>
              <SelectItem value="eth">ETH</SelectItem>
              <SelectItem value="trx">TRX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adjustment_type">Adjustment Type</Label>
          <Select
            value={formData.adjustment_type}
            onValueChange={(value) => setFormData({ ...formData, adjustment_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add (Increase Balance)</SelectItem>
              <SelectItem value="subtract">Subtract (Decrease Balance)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustment_amount">
            Amount <span className="text-red-500">*</span>
          </Label>
          <Input
            id="adjustment_amount"
            type="number"
            step="0.00000001"
            min="0"
            placeholder="0.00"
            value={formData.adjustment_amount}
            onChange={(e) => setFormData({ ...formData, adjustment_amount: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.reason}
          onValueChange={(value) => setFormData({ ...formData, reason: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compensation">User Compensation</SelectItem>
            <SelectItem value="correction">Balance Correction</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="bonus">Bonus/Promotion</SelectItem>
            <SelectItem value="error_fix">Fix System Error</SelectItem>
            <SelectItem value="other">Other (specify in notes)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Provide detailed explanation for this adjustment (e.g., ticket number, error description, etc.)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Processing...' : 'Adjust Balance'}
      </Button>
    </form>
  );
}

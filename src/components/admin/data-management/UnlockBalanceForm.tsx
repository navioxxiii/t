/**
 * Unlock Balance Form - Fix stuck locked funds
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export function UnlockBalanceForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_email: '',
    base_token_code: 'usdt',
    amount: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_email || !formData.amount || !formData.reason) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/data-management/unlock-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Balance unlocked successfully!');
        setFormData({ user_email: '', base_token_code: 'usdt', amount: '', reason: '' });
      } else {
        toast.error(data.error || 'Failed to unlock balance');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex gap-2">
          <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Unlock Locked Balance</p>
            <p className="text-sm text-text-secondary mt-1">
              Release stuck locked funds back to available balance. Use for positions that failed to close properly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>User Email *</Label>
          <Input type="email" value={formData.user_email} onChange={(e) => setFormData({ ...formData, user_email: e.target.value })} required />
        </div>

        <div className="space-y-2">
          <Label>Amount to Unlock *</Label>
          <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={3} required />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Processing...' : 'Unlock Balance'}
      </Button>
    </form>
  );
}

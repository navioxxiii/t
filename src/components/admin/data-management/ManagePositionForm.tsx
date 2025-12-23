/**
 * Manage Position Form - Force close/mature stuck positions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export function ManagePositionForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    position_type: 'earn',
    position_id: '',
    action: 'force_mature',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.position_id || !formData.reason) {
      toast.error('Position ID and reason are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/data-management/manage-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Position updated successfully!');
        setFormData({ ...formData, position_id: '', reason: '' });
      } else {
        toast.error(data.error || 'Failed to update position');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Position Management Warning</p>
            <p className="text-sm text-text-secondary mt-1">
              This will forcefully modify position states. Use only for stuck positions that cannot be resolved normally.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Position Type</Label>
          <Select value={formData.position_type} onValueChange={(value) => setFormData({ ...formData, position_type: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="earn">Earn Position</SelectItem>
              <SelectItem value="copy">Copy Trade Position</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Position ID *</Label>
          <Input
            placeholder="Enter position ID"
            value={formData.position_id}
            onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Action</Label>
        <Select value={formData.action} onValueChange={(value) => setFormData({ ...formData, action: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="force_mature">Force Mature</SelectItem>
            <SelectItem value="force_close">Force Close</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea
          placeholder="Explain why this action is necessary..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" variant="destructive">
        {loading ? 'Processing...' : 'Execute Action'}
      </Button>
    </form>
  );
}

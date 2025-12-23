/**
 * Create Earn Position Form Component
 * Form for manually creating earn positions with custom date
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { UserSelector } from './UserSelector';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths } from 'date-fns';

interface Vault {
  id: string;
  title: string;
  subtitle?: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount?: number;
  current_filled: number;
  total_capacity?: number;
  status: string;
}

export function CreateEarnPositionForm() {
  const [loading, setLoading] = useState(false);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    vault_id: '',
    amount_usdt: '',
    invested_at: new Date(),
    custom_maturity: false,
    matures_at: addMonths(new Date(), 1),
  });

  useEffect(() => {
    fetchVaults();
  }, []);

  useEffect(() => {
    // Auto-calculate maturity date when vault changes
    if (formData.vault_id && !formData.custom_maturity) {
      const vault = vaults.find((v) => v.id === formData.vault_id);
      if (vault) {
        setFormData((prev) => ({
          ...prev,
          matures_at: addMonths(prev.invested_at, vault.duration_months),
        }));
      }
    }
  }, [formData.vault_id, formData.invested_at, formData.custom_maturity, vaults]);

  const fetchVaults = async () => {
    setLoadingVaults(true);
    try {
      const response = await fetch('/api/admin/earn-vaults?pageSize=100');
      const data = await response.json();
      if (response.ok) {
        setVaults(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vaults:', error);
    } finally {
      setLoadingVaults(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.vault_id || !formData.amount_usdt) {
      toast.error('User, vault, and amount are required');
      return;
    }

    if (parseFloat(formData.amount_usdt) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/data-management/create-earn-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create earn position');
      }

      toast.success('Earn position created successfully. Balance deducted and vault updated.');

      // Reset form
      setFormData({
        user_id: '',
        vault_id: '',
        amount_usdt: '',
        invested_at: new Date(),
        custom_maturity: false,
        matures_at: addMonths(new Date(), 1),
      });
    } catch (error) {
      console.error('Error creating earn position:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create earn position');
    } finally {
      setLoading(false);
    }
  };

  const selectedVault = vaults.find((v) => v.id === formData.vault_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>User *</Label>
          <UserSelector
            value={formData.user_id}
            onValueChange={(value) => setFormData({ ...formData, user_id: value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="vault_id">Vault *</Label>
          <Select
            value={formData.vault_id}
            onValueChange={(value) => setFormData({ ...formData, vault_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingVaults ? 'Loading vaults...' : 'Select vault'} />
            </SelectTrigger>
            <SelectContent>
              {vaults.map((vault) => (
                <SelectItem key={vault.id} value={vault.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{vault.title}</span>
                    <span className="ml-4 text-brand-primary font-bold">{vault.apy_percent}% APY</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVault && (
            <div className="text-sm text-text-secondary mt-2">
              <p>Duration: {selectedVault.duration_months} months | Min: ${selectedVault.min_amount}</p>
              {selectedVault.total_capacity && (
                <p>
                  Capacity: ${selectedVault.current_filled.toLocaleString()} / ${selectedVault.total_capacity.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount_usdt">Amount (USDT) *</Label>
          <Input
            id="amount_usdt"
            type="number"
            step="0.01"
            placeholder="100.00"
            value={formData.amount_usdt}
            onChange={(e) => setFormData({ ...formData, amount_usdt: e.target.value })}
            required
          />
          {selectedVault && formData.amount_usdt && parseFloat(formData.amount_usdt) < selectedVault.min_amount && (
            <p className="text-xs text-action-red">
              Amount is below minimum (${selectedVault.min_amount})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Invested At</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.invested_at, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.invested_at}
                onSelect={(date) => date && setFormData({ ...formData, invested_at: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Matures At</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={!formData.custom_maturity}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.matures_at, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.matures_at}
                onSelect={(date) => date && setFormData({ ...formData, matures_at: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="custom_maturity"
            checked={formData.custom_maturity}
            onChange={(e) => setFormData({ ...formData, custom_maturity: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="custom_maturity" className="cursor-pointer">
            Use custom maturity date
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-text-secondary">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Deduct ${formData.amount_usdt || '0'} from user balance</li>
            <li>Update vault capacity</li>
            <li>Create related transaction record</li>
          </ul>
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Position
        </Button>
      </div>
    </form>
  );
}

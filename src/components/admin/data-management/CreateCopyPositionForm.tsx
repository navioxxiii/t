/**
 * Create Copy Position Form Component
 * Form for manually creating copy trading positions with custom date
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
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Trader {
  id: string;
  name: string;
  strategy: string;
  risk_level: string;
  aum_usdt: number;
  current_copiers: number;
  max_copiers: number;
  performance_fee_percent: number;
  historical_roi_min: number;
  historical_roi_max: number;
}

const POSITION_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'stopped', label: 'Stopped' },
];

export function CreateCopyPositionForm() {
  const [loading, setLoading] = useState(false);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loadingTraders, setLoadingTraders] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    trader_id: '',
    allocation_usdt: '',
    status: 'active',
    started_at: new Date(),
  });

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    setLoadingTraders(true);
    try {
      const response = await fetch('/api/copy-trade/traders');
      const data = await response.json();
      if (response.ok) {
        setTraders(data.traders || []);
      }
    } catch (error) {
      console.error('Error fetching traders:', error);
    } finally {
      setLoadingTraders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.trader_id || !formData.allocation_usdt) {
      toast.error('User, trader, and allocation are required');
      return;
    }

    if (parseFloat(formData.allocation_usdt) <= 0) {
      toast.error('Allocation must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/data-management/create-copy-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create copy position');
      }

      toast.success('Copy position created successfully. Balance deducted and trader stats updated.');

      // Reset form
      setFormData({
        user_id: '',
        trader_id: '',
        allocation_usdt: '',
        status: 'active',
        started_at: new Date(),
      });
    } catch (error) {
      console.error('Error creating copy position:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create copy position');
    } finally {
      setLoading(false);
    }
  };

  const selectedTrader = traders.find((t) => t.id === formData.trader_id);

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
          <Label htmlFor="trader_id">Trader *</Label>
          <Select
            value={formData.trader_id}
            onValueChange={(value) => setFormData({ ...formData, trader_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTraders ? 'Loading traders...' : 'Select trader'} />
            </SelectTrigger>
            <SelectContent>
              {traders.map((trader) => (
                <SelectItem key={trader.id} value={trader.id}>
                  <div className="flex items-center gap-2">
                    <span>{trader.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        trader.risk_level === 'low'
                          ? 'bg-action-green/10 text-action-green'
                          : trader.risk_level === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-action-red/10 text-action-red'
                      }
                    >
                      {trader.risk_level}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTrader && (
            <div className="text-sm text-text-secondary mt-2 space-y-1">
              <p>Strategy: {selectedTrader.strategy}</p>
              <p>
                Copiers: {selectedTrader.current_copiers} / {selectedTrader.max_copiers}
              </p>
              <p>
                ROI Range: {selectedTrader.historical_roi_min}% - {selectedTrader.historical_roi_max}%
              </p>
              <p>Performance Fee: {selectedTrader.performance_fee_percent}%</p>
              {selectedTrader.current_copiers >= selectedTrader.max_copiers && (
                <p className="text-action-red font-medium">
                  Warning: Trader is at full capacity
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="allocation_usdt">Allocation (USDT) *</Label>
          <Input
            id="allocation_usdt"
            type="number"
            step="0.01"
            placeholder="1000.00"
            value={formData.allocation_usdt}
            onChange={(e) => setFormData({ ...formData, allocation_usdt: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Started At</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.started_at, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.started_at}
                onSelect={(date) => date && setFormData({ ...formData, started_at: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-text-secondary">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Deduct ${formData.allocation_usdt || '0'} from user balance</li>
            <li>Update trader copier count and AUM</li>
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

/**
 * Create Transaction Form Component
 * Form for manually creating transactions with custom date
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const TRANSACTION_TYPES = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'swap', label: 'Swap' },
  { value: 'earn_claim', label: 'Earn Claim' },
  { value: 'earn_invest', label: 'Earn Investment' },
  { value: 'copy_trade_start', label: 'Copy Trade Start' },
  { value: 'copy_trade_stop', label: 'Copy Trade Stop' },
];

const TRANSACTION_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const COINS = [
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)' },
  { value: 'TRX', label: 'Tron (TRX)' },
  { value: 'LTC', label: 'Litecoin (LTC)' },
];

export function CreateTransactionForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'deposit',
    coin_symbol: 'USDT',
    amount: '',
    status: 'completed',
    tx_hash: '',
    to_address: '',
    from_address: '',
    network_fee: '',
    notes: '',
    created_at: new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.amount) {
      toast.error('User and amount are required');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/data-management/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      toast.success('Transaction created successfully. Balance updated.');

      // Reset form
      setFormData({
        user_id: '',
        type: 'deposit',
        coin_symbol: 'USDT',
        amount: '',
        status: 'completed',
        tx_hash: '',
        to_address: '',
        from_address: '',
        network_fee: '',
        notes: '',
        created_at: new Date(),
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coin_symbol">Cryptocurrency *</Label>
          <Select value={formData.coin_symbol} onValueChange={(value) => setFormData({ ...formData, coin_symbol: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select coin" />
            </SelectTrigger>
            <SelectContent>
              {COINS.map((coin) => (
                <SelectItem key={coin.value} value={coin.value}>
                  {coin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx_hash">Transaction Hash</Label>
          <Input
            id="tx_hash"
            type="text"
            placeholder="0x..."
            value={formData.tx_hash}
            onChange={(e) => setFormData({ ...formData, tx_hash: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to_address">To Address</Label>
          <Input
            id="to_address"
            type="text"
            placeholder="Destination address"
            value={formData.to_address}
            onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from_address">From Address</Label>
          <Input
            id="from_address"
            type="text"
            placeholder="Source address"
            value={formData.from_address}
            onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="network_fee">Network Fee</Label>
          <Input
            id="network_fee"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={formData.network_fee}
            onChange={(e) => setFormData({ ...formData, network_fee: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Transaction Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.created_at, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.created_at}
                onSelect={(date) => date && setFormData({ ...formData, created_at: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about this transaction..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-text-secondary">
          This will automatically update wallet and profile balances.
        </p>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Transaction
        </Button>
      </div>
    </form>
  );
}

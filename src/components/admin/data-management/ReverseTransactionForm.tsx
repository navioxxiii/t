/**
 * Reverse Transaction Form Component
 * Allows admin to reverse/undo erroneous transactions
 * Creates compensating entries and logs the reversal
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export function ReverseTransactionForm() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [formData, setFormData] = useState({
    transaction_id: '',
    reason: '',
    notes: '',
  });
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  const handleSearch = async () => {
    if (!formData.transaction_id) {
      toast.error('Please enter a transaction ID');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions?search=${formData.transaction_id}`);
      const data = await response.json();

      if (response.ok && data.transactions && data.transactions.length > 0) {
        const tx = data.transactions[0];
        setTransactionDetails(tx);
        toast.success('Transaction found');
      } else {
        toast.error('Transaction not found');
        setTransactionDetails(null);
      }
    } catch (error) {
      console.error('Error searching transaction:', error);
      toast.error('Failed to search transaction');
      setTransactionDetails(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionDetails) {
      toast.error('Please search and verify the transaction first');
      return;
    }

    if (!formData.reason) {
      toast.error('Reason is required');
      return;
    }

    if (transactionDetails.status === 'reversed') {
      toast.error('This transaction has already been reversed');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/data-management/reverse-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: formData.transaction_id,
          reason: formData.reason,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to reverse transaction');
        return;
      }

      toast.success('Transaction reversed successfully!');

      // Reset form
      setFormData({
        transaction_id: '',
        reason: '',
        notes: '',
      });
      setTransactionDetails(null);
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast.error('An error occurred while reversing the transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              Transaction Reversal Warning
            </p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">
              This will create a compensating transaction to undo the effects of the original transaction.
              The original transaction will be marked as reversed. This action is logged and cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="transaction_id">
              Transaction ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="transaction_id"
              placeholder="Enter transaction ID to reverse"
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading || !formData.transaction_id}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {transactionDetails && (
          <div className="rounded-lg border bg-bg-secondary p-4 space-y-2">
            <h4 className="font-medium">Transaction Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-tertiary">Type:</span>{' '}
                <span className="font-medium">{transactionDetails.type}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Status:</span>{' '}
                <span className="font-medium">{transactionDetails.status}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Amount USD:</span>{' '}
                <span className="font-medium">${transactionDetails.amount_usd}</span>
              </div>
              <div>
                <span className="text-text-tertiary">User:</span>{' '}
                <span className="font-medium">{transactionDetails.profiles?.email || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-text-tertiary">Created:</span>{' '}
                <span className="font-medium">
                  {new Date(transactionDetails.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">
            Reversal Reason <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reason"
            placeholder="e.g., Duplicate transaction, Processing error, etc."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Provide detailed explanation for this reversal (e.g., ticket number, error description, etc.)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !transactionDetails}
        className="w-full"
        variant="destructive"
      >
        {loading ? 'Processing...' : 'Reverse Transaction'}
      </Button>
    </form>
  );
}

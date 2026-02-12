/**
 * Initialize Balances Form Component
 * Admin form to initialize balances for any user
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Info, Loader2 } from 'lucide-react';

interface InitializeBalancesFormProps {
  userEmail?: string;
  onSuccess?: () => void;
}

export function InitializeBalancesForm({
  userEmail,
  onSuccess,
}: InitializeBalancesFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_email: userEmail || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_email) {
      toast.error('User email is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        '/api/admin/data-management/initialize-balances',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize balances');
      }

      toast.success(data.message || 'Balances initialized successfully');
      onSuccess?.();

      // Reset form if not pre-filled
      if (!userEmail) {
        setFormData({ user_email: '' });
      }
    } catch (error) {
      console.error('Error initializing balances:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to initialize balances'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              About Balance Initialization
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This will create balance entries for all active tokens that don't
              exist for this user. All new balances start at 0. Existing
              balances will not be modified.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This operation is safe and idempotent - it can be run multiple
              times without issues.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user_email">
          User Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="user_email"
          type="email"
          placeholder="user@example.com"
          value={formData.user_email}
          onChange={(e) =>
            setFormData({ ...formData, user_email: e.target.value })
          }
          required
          disabled={!!userEmail}
        />
        <p className="text-xs text-text-tertiary">
          Enter the email of the user whose balances you want to initialize
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Initialize Balances
      </Button>
    </form>
  );
}

/**
 * Wallet Settings Page
 * Transaction limits, fees, and feature flags
 */

'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useSettingsByCategory, useSaveSettings } from '@/hooks/use-settings';
import { Loader2 } from 'lucide-react';

interface FormData {
  min_transaction_amount: string;
  max_transaction_amount: string;
  withdrawal_fee_percentage: string;
  max_wallets_per_user: string;
  enable_swaps: boolean;
  enable_withdrawals: boolean;
}

export default function WalletSettingsPage() {
  const { settings, isLoading } = useSettingsByCategory('wallet');
  const { mutate: saveSettings, isPending } = useSaveSettings('wallet');

  // Compute default values from settings
  const defaultValues = useMemo(
    (): FormData => ({
      min_transaction_amount:
        settings.find((s) => s.key === 'min_transaction_amount')?.value || '0.0001',
      max_transaction_amount:
        settings.find((s) => s.key === 'max_transaction_amount')?.value || '10',
      withdrawal_fee_percentage:
        settings.find((s) => s.key === 'withdrawal_fee_percentage')?.value || '1.0',
      max_wallets_per_user:
        settings.find((s) => s.key === 'max_wallets_per_user')?.value || '10',
      enable_swaps: settings.find((s) => s.key === 'enable_swaps')?.value === 'true',
      enable_withdrawals: settings.find((s) => s.key === 'enable_withdrawals')?.value === 'true',
    }),
    [settings]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    const updates = [
      { key: 'min_transaction_amount', value: data.min_transaction_amount },
      { key: 'max_transaction_amount', value: data.max_transaction_amount },
      { key: 'withdrawal_fee_percentage', value: data.withdrawal_fee_percentage },
      { key: 'max_wallets_per_user', value: data.max_wallets_per_user },
      { key: 'enable_swaps', value: String(data.enable_swaps) },
      { key: 'enable_withdrawals', value: String(data.enable_withdrawals) },
    ];

    saveSettings(updates, {
      onSuccess: () => {
        toast.success('Wallet settings saved successfully');
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to save settings');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <Card className="bg-bg-secondary border-bg-tertiary">
      <CardHeader>
        <CardTitle className="text-text-primary">Wallet Settings</CardTitle>
        <CardDescription className="text-text-secondary">
          Transaction limits, fees, and feature flags
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Transaction Limits */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Transaction Limits</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_transaction_amount" className="text-text-primary">
                    Minimum Transaction Amount
                  </Label>
                  <Input
                    id="min_transaction_amount"
                    type="number"
                    step="0.0001"
                    {...register('min_transaction_amount', {
                      required: 'Minimum amount is required',
                      min: { value: 0, message: 'Must be at least 0' },
                      max: { value: 1, message: 'Must be at most 1' },
                    })}
                    placeholder="0.0001"
                    className="bg-bg-primary text-text-primary border-bg-tertiary mt-2"
                  />
                  <p className="text-xs text-text-secondary mt-1">In BTC equivalent</p>
                  {errors.min_transaction_amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.min_transaction_amount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="max_transaction_amount" className="text-text-primary">
                    Maximum Transaction Amount
                  </Label>
                  <Input
                    id="max_transaction_amount"
                    type="number"
                    step="0.01"
                    {...register('max_transaction_amount', {
                      required: 'Maximum amount is required',
                      min: { value: 0, message: 'Must be at least 0' },
                      max: { value: 100, message: 'Must be at most 100' },
                    })}
                    placeholder="10"
                    className="bg-bg-primary text-text-primary border-bg-tertiary mt-2"
                  />
                  <p className="text-xs text-text-secondary mt-1">In BTC</p>
                  {errors.max_transaction_amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.max_transaction_amount.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fees & Limits */}
            <div className="space-y-4 pt-4 border-t border-bg-tertiary">
              <h3 className="text-sm font-semibold text-text-primary">Fees & Limits</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="withdrawal_fee_percentage" className="text-text-primary">
                    Withdrawal Fee Percentage
                  </Label>
                  <Input
                    id="withdrawal_fee_percentage"
                    type="number"
                    step="0.1"
                    {...register('withdrawal_fee_percentage', {
                      required: 'Fee percentage is required',
                      min: { value: 0, message: 'Must be at least 0' },
                      max: { value: 10, message: 'Must be at most 10' },
                    })}
                    placeholder="1.0"
                    className="bg-bg-primary text-text-primary border-bg-tertiary mt-2"
                  />
                  <p className="text-xs text-text-secondary mt-1">Platform fee (0-10%)</p>
                  {errors.withdrawal_fee_percentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.withdrawal_fee_percentage.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="max_wallets_per_user" className="text-text-primary">
                    Max Wallets Per User
                  </Label>
                  <Input
                    id="max_wallets_per_user"
                    type="number"
                    {...register('max_wallets_per_user', {
                      required: 'Max wallets is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      max: { value: 100, message: 'Must be at most 100' },
                    })}
                    placeholder="10"
                    className="bg-bg-primary text-text-primary border-bg-tertiary mt-2"
                  />
                  <p className="text-xs text-text-secondary mt-1">Prevent abuse (1-100)</p>
                  {errors.max_wallets_per_user && (
                    <p className="text-sm text-red-500 mt-1">{errors.max_wallets_per_user.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feature Flags */}
            <div className="space-y-4 pt-4 border-t border-bg-tertiary">
              <h3 className="text-sm font-semibold text-text-primary">Feature Flags</h3>

              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="enable_swaps" className="text-text-primary font-medium">
                    Enable Swaps
                  </Label>
                  <p className="text-sm text-text-secondary">
                    Allow users to swap between cryptocurrencies
                  </p>
                </div>
                <Switch
                  id="enable_swaps"
                  checked={watch('enable_swaps') || false}
                  onCheckedChange={(checked) => {
                    setValue('enable_swaps', checked, { shouldDirty: true });
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="enable_withdrawals" className="text-text-primary font-medium">
                    Enable Withdrawals
                  </Label>
                  <p className="text-sm text-text-secondary">
                    Allow users to withdraw funds
                  </p>
                </div>
                <Switch
                  id="enable_withdrawals"
                  checked={watch('enable_withdrawals') || false}
                  onCheckedChange={(checked) => {
                    setValue('enable_withdrawals', checked, { shouldDirty: true });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || isPending}
              className="bg-bg-primary text-text-primary border-bg-tertiary hover:bg-bg-tertiary"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className="bg-primary text-text-primary hover:bg-primary/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Wallet Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

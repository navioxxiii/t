/**
 * System Settings Page
 * Maintenance mode and registration controls
 */

'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useSettingsByCategory, useSaveSettings } from '@/hooks/use-settings';
import { Loader2 } from 'lucide-react';

interface FormData {
  maintenance_mode: boolean;
  maintenance_message: string;
  enable_new_registrations: boolean;
}

export default function SystemSettingsPage() {
  const { settings, isLoading } = useSettingsByCategory('system');
  const { mutate: saveSettings, isPending } = useSaveSettings('system');

  // Compute default values from settings
  const defaultValues = useMemo(
    (): FormData => ({
      maintenance_mode: settings.find((s) => s.key === 'maintenance_mode')?.value === 'true',
      maintenance_message: settings.find((s) => s.key === 'maintenance_message')?.value || '',
      enable_new_registrations:
        settings.find((s) => s.key === 'enable_new_registrations')?.value === 'true',
    }),
    [settings]
  );

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } =
    useForm<FormData>({
      defaultValues,
    });

  const onSubmit = async (data: FormData) => {
    const updates = [
      { key: 'maintenance_mode', value: String(data.maintenance_mode) },
      { key: 'maintenance_message', value: data.maintenance_message },
      { key: 'enable_new_registrations', value: String(data.enable_new_registrations) },
    ];

    saveSettings(updates, {
      onSuccess: () => {
        toast.success('System settings saved successfully');
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
        <CardTitle className="text-text-primary">System Settings</CardTitle>
        <CardDescription className="text-text-secondary">
          Maintenance mode and registration controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="maintenance_mode" className="text-text-primary font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-text-secondary">
                  Enable to put the application in maintenance mode
                </p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={watch('maintenance_mode') || false}
                onCheckedChange={(checked) => {
                  setValue('maintenance_mode', checked, { shouldDirty: true });
                }}
              />
            </div>

            {/* Maintenance Message */}
            {watch('maintenance_mode') && (
              <div>
                <Label htmlFor="maintenance_message" className="text-text-primary">
                  Maintenance Message
                </Label>
                <Textarea
                  id="maintenance_message"
                  {...register('maintenance_message', {
                    maxLength: { value: 500, message: 'Message is too long (max 500 characters)' },
                  })}
                  placeholder="We are currently undergoing maintenance..."
                  rows={3}
                  className="bg-bg-primary text-text-primary border-bg-tertiary mt-2"
                />
                {errors.maintenance_message && (
                  <p className="text-sm text-red-500 mt-1">{errors.maintenance_message.message}</p>
                )}
              </div>
            )}

            {/* Enable New Registrations */}
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="enable_new_registrations" className="text-text-primary font-medium">
                  Enable New Registrations
                </Label>
                <p className="text-sm text-text-secondary">
                  Allow new users to create accounts
                </p>
              </div>
              <Switch
                id="enable_new_registrations"
                checked={watch('enable_new_registrations') || false}
                onCheckedChange={(checked) => {
                  setValue('enable_new_registrations', checked, { shouldDirty: true });
                }}
              />
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
              Save System Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Toggle Vault Visibility Dialog
 * Quick status toggle to control vault visibility to investors
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToggleVaultStatus } from '@/hooks/useAdminEarnVaults';

interface Vault {
  id: string;
  title: string;
  status: string;
}

interface ToggleVisibilityDialogProps {
  vault: Vault | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleVisibilityDialog({
  vault,
  open,
  onOpenChange,
}: ToggleVisibilityDialogProps) {
  const toggleMutation = useToggleVaultStatus();

  // Derive selected status directly from vault - no state needed
  const [selectedStatus, setSelectedStatus] = useState('active');

  // Only sync when dialog actually opens
  useEffect(() => {
    if (open && vault) {
      setSelectedStatus(vault.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!vault) return null;

  const handleSubmit = () => {
    toggleMutation.mutate(
      { vaultId: vault.id, status: selectedStatus },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const statusOptions = [
    {
      value: 'active',
      icon: Eye,
      label: 'Active (Visible)',
      description: 'Visible to investors, accepts new investments',
      color: 'text-action-green',
      borderColor: 'border-action-green/30',
    },
    {
      value: 'sold_out',
      icon: EyeOff,
      label: 'Sold Out (Hidden)',
      description: 'Hidden from investors (capacity reached)',
      color: 'text-action-red',
      borderColor: 'border-action-red/30',
    },
    {
      value: 'ended',
      icon: EyeOff,
      label: 'Ended (Hidden)',
      description: 'Hidden from investors (vault closed)',
      color: 'text-text-tertiary',
      borderColor: 'border-text-tertiary/30',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Toggle Vault Visibility</DialogTitle>
          <DialogDescription>
            Control whether &quot;{vault.title}&quot; is visible to investors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm p-3 bg-bg-tertiary rounded-lg">
            <strong className="text-text-primary">Current Status:</strong>{' '}
            <span className="text-text-secondary capitalize">{vault.status.replace('_', ' ')}</span>
          </div>

          <div className="space-y-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:bg-bg-tertiary ${
                    isSelected
                      ? `${option.borderColor} bg-bg-tertiary`
                      : 'border-border-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary flex items-center justify-center'
                          : 'border-border-secondary'
                      }`}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <Label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        {option.label}
                      </Label>
                      <p className="text-xs text-text-tertiary mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 text-xs text-text-tertiary bg-bg-tertiary p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Existing positions are not affected by status changes. Users with active positions can still view their investments.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={toggleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={toggleMutation.isPending || selectedStatus === vault.status}
          >
            {toggleMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

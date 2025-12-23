/**
 * ConfirmActionDialog Component
 * Reusable confirmation dialog for critical actions
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DetailItem {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  details?: DetailItem[];
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmActionDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {variant === 'destructive' && (
              <div className="rounded-full bg-action-red/10 p-2">
                <AlertTriangle className="h-5 w-5 text-action-red" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Details Section */}
        {details && details.length > 0 && (
          <div className="space-y-2 py-4">
            {details.map((detail, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  detail.highlight
                    ? 'bg-brand-primary/10 border border-brand-primary/30'
                    : 'bg-bg-tertiary'
                }`}
              >
                <span className="text-sm text-text-secondary">{detail.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    detail.highlight ? 'text-brand-primary' : 'text-text-primary'
                  }`}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-action-red hover:bg-action-red/90' : ''}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

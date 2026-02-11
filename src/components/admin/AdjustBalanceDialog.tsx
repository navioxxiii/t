'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdjustBalanceForm } from '@/components/admin/data-management/AdjustBalanceForm';
import { UserProfile } from '@/hooks/useAdminUsers';
import { useQueryClient } from '@tanstack/react-query';

interface AdjustBalanceDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustBalanceDialog({ user, open, onOpenChange }: AdjustBalanceDialogProps) {
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Balance</DialogTitle>
          <DialogDescription>
            Adjust balance for {user.email}
          </DialogDescription>
        </DialogHeader>
        <AdjustBalanceForm userEmail={user.email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

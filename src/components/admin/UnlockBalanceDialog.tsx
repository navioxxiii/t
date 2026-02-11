'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnlockBalanceForm } from '@/components/admin/data-management/UnlockBalanceForm';
import { UserProfile } from '@/hooks/useAdminUsers';
import { useQueryClient } from '@tanstack/react-query';

interface UnlockBalanceDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnlockBalanceDialog({ user, open, onOpenChange }: UnlockBalanceDialogProps) {
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
          <DialogTitle>Unlock Balance</DialogTitle>
          <DialogDescription>
            Unlock locked balance for {user.email}
          </DialogDescription>
        </DialogHeader>
        <UnlockBalanceForm userEmail={user.email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateTransactionForm } from '@/components/admin/data-management/CreateTransactionForm';
import { UserProfile } from '@/hooks/useAdminUsers';
import { useQueryClient } from '@tanstack/react-query';

interface CreateTransactionDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTransactionDialog({ user, open, onOpenChange }: CreateTransactionDialogProps) {
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Create a transaction for {user.email}
          </DialogDescription>
        </DialogHeader>
        <CreateTransactionForm userId={user.id} userEmail={user.email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

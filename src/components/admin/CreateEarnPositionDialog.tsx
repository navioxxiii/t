'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateEarnPositionForm } from '@/components/admin/data-management/CreateEarnPositionForm';
import { UserProfile } from '@/hooks/useAdminUsers';
import { useQueryClient } from '@tanstack/react-query';

interface CreateEarnPositionDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEarnPositionDialog({ user, open, onOpenChange }: CreateEarnPositionDialogProps) {
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
          <DialogTitle>Create Earn Position</DialogTitle>
          <DialogDescription>
            Create an earn position for {user.email}
          </DialogDescription>
        </DialogHeader>
        <CreateEarnPositionForm userId={user.id} userEmail={user.email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

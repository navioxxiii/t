/**
 * Change Role Dialog
 * Allow super_admins to change user roles
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUpdateUserRole, UserProfile } from '@/hooks/useAdminUsers';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, User as UserIcon, Shield } from 'lucide-react';

interface ChangeRoleDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleConfig = {
  user: {
    label: 'User',
    description: 'Regular user with standard access',
    icon: UserIcon,
    color: 'bg-bg-tertiary text-text-primary',
  },
  admin: {
    label: 'Admin',
    description: 'Admin with elevated permissions',
    icon: Shield,
    color: 'bg-brand-primary/10 text-brand-primary',
  },
  super_admin: {
    label: 'Super Admin',
    description: 'Full system access and control',
    icon: ShieldCheck,
    color: 'bg-brand-primary/20 text-brand-primary',
  },
};

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<
    'user' | 'admin' | 'super_admin'
  >(user?.role || 'user');
  const updateRole = useUpdateUserRole();

  const handleSubmit = () => {
    if (!user) return;

    updateRole.mutate(
      {
        userId: user.id,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!user) return null;

  const currentRoleConfig = roleConfig[user.role as keyof typeof roleConfig];
  const newRoleConfig = roleConfig[selectedRole];
  const roleChanged = selectedRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user.email}. This will change their access
            permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Role */}
          <div className="space-y-2">
            <Label className="text-text-primary">Current Role</Label>
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              {currentRoleConfig && (
                <>
                  <currentRoleConfig.icon className="h-5 w-5 text-text-secondary" />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">{currentRoleConfig.label}</div>
                    <div className="text-sm text-text-tertiary">
                      {currentRoleConfig.description}
                    </div>
                  </div>
                  <Badge className={currentRoleConfig.color}>
                    {currentRoleConfig.label}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-text-primary">New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as 'user' | 'admin' | 'super_admin')
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>User</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Super Admin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {newRoleConfig && (
              <p className="text-sm text-text-tertiary">
                {newRoleConfig.description}
              </p>
            )}
          </div>

          {/* Warning if no change */}
          {!roleChanged && (
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
              <p className="text-sm text-brand-primary">
                You haven&apos;t selected a different role. The user&apos;s
                role will remain unchanged.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateRole.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!roleChanged || updateRole.isPending}
          >
            {updateRole.isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

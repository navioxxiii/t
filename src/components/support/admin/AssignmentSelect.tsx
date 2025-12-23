/**
 * Assignment Select Component
 * Dropdown to assign tickets to admins
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AssignmentSelectProps {
  currentAssignment?: string | null;
  onAssign: (adminId: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function AssignmentSelect({
  currentAssignment,
  onAssign,
  disabled,
  compact,
}: AssignmentSelectProps) {
  // Derive value from props instead of state to avoid cascading renders
  const value = currentAssignment || 'unassigned';

  // Fetch list of admins
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?role=admin,super_admin');
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      return response.json();
    },
  });

  const admins = data?.users || [];

  const handleValueChange = (newValue: string) => {
    if (newValue === 'unassigned') {
      onAssign(null);
    } else {
      onAssign(newValue);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading admins...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={compact ? "w-[130px] h-8 bg-bg-secondary border-bg-tertiary" : "w-full bg-bg-secondary border-bg-tertiary"}>
        <SelectValue placeholder="Assign to..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {admins.map((admin: { id: string; email: string; full_name?: string }) => (
          <SelectItem key={admin.id} value={admin.id}>
            {admin.full_name || admin.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Status Badge Component
 * Reusable badge for displaying status with color coding
 */

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status:
    | 'active'
    | 'banned'
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'admin_approved'
    | 'rejected';
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-action-green/10 text-action-green',
  },
  banned: {
    label: 'Banned',
    className: 'bg-action-red/10 text-action-red',
  },
  pending: {
    label: 'Pending',
    className: 'bg-brand-primary/10 text-brand-primary',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-brand-primary/10 text-brand-primary',
  },
  completed: {
    label: 'Completed',
    className: 'bg-action-green/10 text-action-green',
  },
  failed: {
    label: 'Failed',
    className: 'bg-action-red/10 text-action-red',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-bg-tertiary text-text-secondary',
  },
  admin_approved: {
    label: 'Admin Approved',
    className: 'bg-yellow-500/10 text-yellow-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-action-red/10 text-action-red',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

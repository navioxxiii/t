/**
 * Ticket Status Badge Component
 * Color-coded status badges (Binance style)
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'Open',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      case 'resolved':
        return {
          label: 'Resolved',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'closed':
        return {
          label: 'Closed',
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

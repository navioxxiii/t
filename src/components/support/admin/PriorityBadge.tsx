/**
 * Priority Badge Component
 * Color-coded priority indicator for support tickets
 */

import { Badge } from '@/components/ui/badge';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          className: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
      case 'high':
        return {
          label: 'High',
          className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
      case 'normal':
        return {
          label: 'Normal',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'low':
        return {
          label: 'Low',
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}

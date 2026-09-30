/**
 * SummaryStat Component
 * Compact labelled figure used in portfolio summaries
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}

export function SummaryStat({ icon: Icon, label, value, sub, valueClassName }: SummaryStatProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Icon className="h-4 w-4" />
          <p className="text-xs">{label}</p>
        </div>
        <p className={cn('mt-1 text-base md:text-lg font-bold', valueClassName)}>{value}</p>
        {sub && <p className={cn('text-xs', valueClassName ?? 'text-text-tertiary')}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Earn display helpers
 */

export { getRiskColor } from '@/lib/format/risk';

export function formatDuration(months: number, long = false): string {
  if (long) return `${months} ${months === 1 ? 'month' : 'months'}`;
  return `${months} ${months === 1 ? 'mo' : 'mos'}`;
}

export function formatTimeRemaining(daysRemaining: number, hoursRemaining: number): string {
  if (daysRemaining > 0) return `${daysRemaining}d ${hoursRemaining}h left`;
  if (hoursRemaining > 0) return `${hoursRemaining}h left`;
  return 'Less than 1h left';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

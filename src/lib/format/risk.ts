/**
 * Risk level display helpers shared across investment features
 */

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low':
      return 'bg-action-green/10 text-action-green border-action-green/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'high':
      return 'bg-action-red/10 text-action-red border-action-red/30';
    default:
      return 'bg-bg-tertiary text-text-secondary';
  }
}

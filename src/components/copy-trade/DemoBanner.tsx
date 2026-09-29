/**
 * DemoBanner Component
 * Persistent notice that copy trading data is simulated
 */

import { FlaskConical } from 'lucide-react';

export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5"
    >
      <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
      <p className="text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">Demo mode</span> — Traders, returns
        and P&L shown here are simulated for demonstration. No real trading takes place.
      </p>
    </div>
  );
}

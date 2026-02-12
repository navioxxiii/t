/**
 * Admin Ticket Detail Page
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 */

export default function AdminTicketDetailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Support Ticketing Migrated</h1>
      <p className="text-text-secondary mb-4">
        The support ticketing system has been migrated to Tawk.to.
      </p>
      <p className="text-text-secondary mb-6">
        Please access the Tawk.to admin dashboard to manage support tickets and conversations.
      </p>
      <a
        href="https://dashboard.tawk.to/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand-primary text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-brand-primary/90 transition-colors inline-block"
      >
        Open Tawk.to Dashboard
      </a>
    </div>
  );
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This was a comprehensive ticket management interface (~445 lines) with:
 * - Split layout (messages 70% + user context sidebar 30%)
 * - Real-time message updates via Supabase subscriptions
 * - Admin replies and internal notes
 * - Response template selector with keyboard shortcuts
 * - Ticket status management (open, in progress, resolved, closed, reopen)
 * - Priority and category updates
 * - Ticket assignment with admin selector
 * - Related entity viewing (transactions, earn positions, copy positions)
 * - Soft/hard delete with restore capability
 * - User online status indicator
 * - Shortcut popup with fuzzy search (typing "/" triggers template shortcuts)
 * - Keyboard navigation for shortcuts (Arrow keys, Enter, Tab, Escape)
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

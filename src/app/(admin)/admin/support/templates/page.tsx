/**
 * Admin Support Templates Page
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 */

export default function AdminTemplatesPage() {
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
 * This was a complete template management interface (~390 lines) with:
 * - CRUD operations for response templates
 * - Search functionality
 * - Category filtering
 * - Template table with sortable columns
 * - Global vs personal template scopes
 * - Keyboard shortcuts for quick insertion
 * - Usage count tracking
 * - Permission-based editing (super admin can edit all, regular admin can edit own)
 * - Delete confirmation dialog
 * - Template form dialog for creating/editing
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

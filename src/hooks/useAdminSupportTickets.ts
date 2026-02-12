/**
 * useAdminSupportTickets Hook
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This hook has been disabled. Original implementation preserved in git history.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

export function useAdminSupportTickets(
  _status: string,
  _priority: string,
  _category: string,
  _showDeleted: boolean,
  _search: string
) {
  return useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => ({ tickets: [] }),
    enabled: false,
  });
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This hook fetched and filtered admin support tickets with real-time updates.
 * Features included:
 * - Advanced filtering (status, priority, category, search)
 * - Soft-deleted ticket visibility for super admins
 * - Real-time invalidation on changes
 * - Optimized query performance
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

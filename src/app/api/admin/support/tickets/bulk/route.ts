/**
 * Admin Support Tickets Bulk Operations API
 * POST /api/admin/support/tickets/bulk - Perform bulk actions on tickets
 *
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This API has been disabled. Original implementation preserved in git history.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Support ticketing system has been migrated to Tawk.to' },
    { status: 503 }
  );
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This endpoint supported bulk operations on up to 100 tickets at a time:
 * - close: Mark tickets as closed
 * - resolve: Mark tickets as resolved
 * - assign: Assign tickets to an admin or unassign
 * - change_priority: Change ticket priority
 * - delete: Soft-delete tickets (super_admin only)
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

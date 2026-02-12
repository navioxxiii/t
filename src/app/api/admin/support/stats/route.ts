/**
 * Admin Support Stats API
 * GET /api/admin/support/stats
 * Returns aggregate statistics for support dashboard
 *
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This API has been disabled. Original implementation preserved in git history.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Support ticketing system has been migrated to Tawk.to' },
    { status: 503 }
  );
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This endpoint provided comprehensive support statistics including:
 * - Total ticket counts
 * - Breakdown by status, priority, assignment, user type, and category
 * - Recent activity (last 24 hours, last 7 days)
 * - Unread message counts
 * - Top assigned admins with ticket counts
 *
 * All queries were optimized to run in parallel for performance.
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

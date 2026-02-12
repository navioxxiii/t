/**
 * Admin Reply to Ticket API
 * POST /api/admin/support/tickets/[id]/reply
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
 * This endpoint allowed admins to reply to tickets with automatic email
 * notifications sent to users or guests. It also updated ticket status
 * to "in_progress" when an admin replied.
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

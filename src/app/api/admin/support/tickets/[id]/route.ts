/**
 * Admin Ticket Detail API
 * GET /api/admin/support/tickets/[id] - Get ticket details with messages
 * PATCH /api/admin/support/tickets/[id] - Update ticket (status, priority, category, assignment)
 * DELETE /api/admin/support/tickets/[id] - Delete ticket (soft for admin, hard for super_admin)
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

export async function PATCH() {
  return NextResponse.json(
    { error: 'Support ticketing system has been migrated to Tawk.to' },
    { status: 503 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Support ticketing system has been migrated to Tawk.to' },
    { status: 503 }
  );
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This ~500 line file contained full ticket detail fetching with related
 * entities (transactions, earn positions, copy positions), admin updates
 * (status, priority, category, assignment), and both soft/hard delete logic.
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

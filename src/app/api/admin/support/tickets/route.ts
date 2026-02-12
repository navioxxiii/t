/**
 * Admin Support Tickets API
 * GET /api/admin/support/tickets - Get all tickets with filters
 *
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This API has been disabled. Original implementation preserved below for reference.
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
 * Full implementation with filtering, search, and unread counts has been
 * commented out. This endpoint supported status, category, priority filters,
 * assignment filtering, guest filtering, search by ticket number/email/subject,
 * and soft-deleted ticket visibility for super admins.
 *
 * See git history to restore the full ~150 line implementation.
 *
 * ============================================================================ */

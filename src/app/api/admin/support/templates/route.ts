/**
 * Admin Support Response Templates API
 * GET /api/admin/support/templates - List all templates
 * POST /api/admin/support/templates - Create a new template
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
 * This endpoint managed support response templates that admins could use for
 * quick replies. Supported filtering by category, shortcuts, and usage tracking.
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

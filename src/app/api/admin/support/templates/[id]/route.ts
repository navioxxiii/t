/**
 * Admin Support Response Template API
 * GET /api/admin/support/templates/[id] - Get single template
 * PATCH /api/admin/support/templates/[id] - Update template
 * DELETE /api/admin/support/templates/[id] - Delete template
 * POST /api/admin/support/templates/[id]/use - Increment usage count
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

export async function POST() {
  return NextResponse.json(
    { error: 'Support ticketing system has been migrated to Tawk.to' },
    { status: 503 }
  );
}

/**
 * Admin Internal Note API
 * POST /api/admin/support/tickets/[id]/note
 * Internal notes are only visible to admins
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

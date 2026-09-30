/**
 * Authorization for scheduled jobs (called by cron-job.org with
 * `Authorization: Bearer <CRON_SECRET>`)
 *
 * - When CRON_SECRET is set, the header must match - in every environment
 * - When it isn't set, jobs are refused in production and allowed only in local development
 */

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Returns an error response to send back, or null when the request may run the job */
export function rejectUnauthorizedCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[cron] CRON_SECRET is not configured - refusing to run scheduled job');
      return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
    }
    return null; // local development without a secret
  }

  const header = request.headers.get('authorization') ?? '';
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Shared guards for staking API routes
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STAKING_ENABLED } from '@/lib/feature-flags';
import { StakingError } from './service';

type Guard<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

/** User-facing routes: 404 while the feature is off, 401 without a session */
export async function requireStakingUser(): Promise<Guard<{ id: string }>> {
  if (!STAKING_ENABLED) {
    return { ok: false, response: NextResponse.json({ error: 'Feature not available' }, { status: 404 }) };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { ok: true, value: { id: user.id } };
}

/** Admin routes work with the flag off, so ops can configure coins before launch */
export async function requireStakingAdmin(): Promise<Guard<{ id: string; role: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, value: { id: user.id, role: profile.role } };
}

export function stakingErrorResponse(error: unknown) {
  if (error instanceof StakingError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('[staking] Unexpected error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

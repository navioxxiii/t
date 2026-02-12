/**
 * ⚠️ SECURITY CRITICAL: Password Audit Access API
 *
 * GET /api/admin/password-audit?user_id=xxx
 *
 * Allows super_admins to retrieve password history for compliance/audit.
 * All access is logged to admin_action_logs.
 *
 * Access Control: Super admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPasswordHistory } from '@/lib/security/password-audit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Super admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      );
    }

    // 3. Get user_id from query params
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('user_id');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id query parameter required' },
        { status: 400 }
      );
    }

    // 4. Retrieve password history (logs access automatically)
    const history = await getUserPasswordHistory({
      userId: targetUserId,
      requestingAdminId: user.id,
      requestingAdminEmail: profile.email,
    });

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      password_history: history,
    });
  } catch (error) {
    console.error('[Password Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

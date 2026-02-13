/**
 * Admin Balance Initialization API
 * POST /api/admin/data-management/initialize-balances
 * Allows admins to initialize balances for any user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureUserBalances } from '@/lib/users/balances';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !['admin', 'super_admin'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { user_email } = body;

    if (!user_email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get target user (use admin client)
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await ensureUserBalances(targetUser.id, {
      client: supabaseAdmin,
    });

    if (!result.success) {
      console.error('[Admin Initialize Balances] Error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to initialize balances' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'initialize_balances',
      target_user_id: targetUser.id,
      target_user_email: targetUser.email,
      details: {
        created_count: result.created,
        skipped_count: result.skipped,
        total_tokens: result.total,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      userId: targetUser.id,
      created: result.created,
      skipped: result.skipped,
      total: result.total,
      message:
        result.created > 0
          ? `Initialized ${result.created} token balances for ${user_email}`
          : `All token balances already initialized for ${user_email}`,
    });
  } catch (error) {
    console.error('Admin initialize balances API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

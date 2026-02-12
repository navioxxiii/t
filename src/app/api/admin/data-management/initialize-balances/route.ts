/**
 * Admin Balance Initialization API
 * POST /api/admin/data-management/initialize-balances
 * Allows admins to initialize balances for any user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Get all active base tokens
    const { data: baseTokens, error: tokensError } = await supabaseAdmin
      .from('base_tokens')
      .select('id, symbol, code')
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching base tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch active tokens' },
        { status: 500 }
      );
    }

    if (!baseTokens || baseTokens.length === 0) {
      return NextResponse.json(
        { error: 'No active tokens found' },
        { status: 404 }
      );
    }

    // Get existing balances for target user
    const { data: existingBalances, error: balancesError } =
      await supabaseAdmin
        .from('user_balances')
        .select('base_token_id')
        .eq('user_id', targetUser.id);

    if (balancesError) {
      console.error('Error fetching user balances:', balancesError);
      return NextResponse.json(
        { error: 'Failed to fetch existing balances' },
        { status: 500 }
      );
    }

    // Find missing tokens
    const existingTokenIds = new Set(
      (existingBalances || []).map((b) => b.base_token_id)
    );
    const missingTokens = baseTokens.filter(
      (t) => !existingTokenIds.has(t.id)
    );

    // Create balances for missing tokens only
    let created = 0;
    if (missingTokens.length > 0) {
      const balancesToInsert = missingTokens.map((token) => ({
        user_id: targetUser.id,
        base_token_id: token.id,
        balance: 0,
        locked_balance: 0,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_balances')
        .insert(balancesToInsert);

      if (insertError) {
        console.error('Error creating balances:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize balances' },
          { status: 500 }
        );
      }

      created = missingTokens.length;
    }

    // Log admin action
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'initialize_balances',
      target_user_id: targetUser.id,
      target_user_email: targetUser.email,
      details: {
        created_count: created,
        skipped_count: existingBalances?.length || 0,
        total_tokens: baseTokens.length,
        tokens_created: missingTokens.map((t) => t.symbol),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      created,
      skipped: existingBalances?.length || 0,
      total: baseTokens.length,
      message:
        created > 0
          ? `Initialized ${created} token balances for ${user_email}`
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

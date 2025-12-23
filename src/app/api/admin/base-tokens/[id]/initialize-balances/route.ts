/**
 * Initialize User Balances API Endpoint
 * POST - Create user_balances records for all users for this base token
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (super_admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify base token exists
    const { data: baseToken, error: tokenError } = await supabase
      .from('base_tokens')
      .select('id, code, symbol, name')
      .eq('id', id)
      .single();

    if (tokenError || !baseToken) {
      return NextResponse.json({ error: 'Base token not found' }, { status: 404 });
    }

    // Get all user IDs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users found',
        created: 0,
        skipped: 0
      });
    }

    // Create balance records for all users
    const balanceRecords = users.map((u) => ({
      user_id: u.id,
      base_token_id: id,
      balance: 0,
      locked_balance: 0,
    }));

    // Insert with ON CONFLICT to skip existing records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('user_balances')
      .upsert(balanceRecords, {
        onConflict: 'user_id,base_token_id',
        ignoreDuplicates: true
      })
      .select('id');

    if (insertError) {
      console.error('Error creating balance records:', insertError);
      return NextResponse.json({ error: 'Failed to create balance records' }, { status: 500 });
    }

    const created = insertedRecords?.length || 0;
    const skipped = users.length - created;

    return NextResponse.json({
      success: true,
      message: `Initialized balances for ${baseToken.symbol}`,
      base_token: {
        id: baseToken.id,
        code: baseToken.code,
        symbol: baseToken.symbol,
        name: baseToken.name,
      },
      total_users: users.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error('Initialize balances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

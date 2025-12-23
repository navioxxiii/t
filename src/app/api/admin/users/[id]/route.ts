/**
 * Admin User Details API
 * GET /api/admin/users/[id] - Get single user details with wallets and recent transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user balances with token info
    const { data: balances } = await supabase
      .from('user_balances')
      .select(`
        id,
        balance,
        locked_balance,
        created_at,
        updated_at,
        base_tokens:base_token_id (
          id,
          code,
          name,
          symbol,
          decimals,
          icon,
          logo_url,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Transform to wallet-like format for backward compatibility
    const wallets = (balances || []).map((balance) => {
      const token = Array.isArray(balance.base_tokens)
        ? balance.base_tokens[0]
        : balance.base_tokens;
      return {
        id: balance.id,
        user_id: userId,
        coin_symbol: token?.symbol || '',
        coin_name: token?.name || '',
        balance: balance.balance,
        locked_balance: balance.locked_balance,
        created_at: balance.created_at,
        updated_at: balance.updated_at,
        token,
      };
    });

    // Get recent transactions (last 10)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: userProfile,
      wallets: wallets || [],
      recent_transactions: transactions || [],
    });
  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

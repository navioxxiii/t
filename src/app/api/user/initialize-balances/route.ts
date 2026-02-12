/**
 * User Self-Service Balance Initialization API
 * POST /api/user/initialize-balances
 * Allows users to initialize their own balances for all active tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active base tokens
    const { data: baseTokens, error: tokensError } = await supabase
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

    // Get existing balances for this user
    const { data: existingBalances, error: balancesError } = await supabase
      .from('user_balances')
      .select('base_token_id')
      .eq('user_id', user.id);

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
        user_id: user.id,
        base_token_id: token.id,
        balance: 0,
        locked_balance: 0,
      }));

      const { error: insertError } = await supabase
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

    return NextResponse.json({
      success: true,
      created,
      skipped: existingBalances?.length || 0,
      total: baseTokens.length,
      message:
        created > 0
          ? `Initialized ${created} token balances successfully`
          : 'All token balances already initialized',
    });
  } catch (error) {
    console.error('User initialize balances API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

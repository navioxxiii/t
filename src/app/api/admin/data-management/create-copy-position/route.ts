/**
 * Admin Create Copy Position API
 * POST /api/admin/data-management/create-copy-position
 * Manually create a copy trading position with balance deduction and trader updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { user_id, trader_id, allocation_usdt, status, started_at } = body;

    // Validate input
    if (!user_id || !trader_id || !allocation_usdt) {
      return NextResponse.json(
        { error: 'User, trader, and allocation are required' },
        { status: 400 }
      );
    }

    if (parseFloat(allocation_usdt) <= 0) {
      return NextResponse.json(
        { error: 'Allocation must be greater than 0' },
        { status: 400 }
      );
    }

    // Get trader details
    const { data: trader, error: traderError } = await supabase
      .from('traders')
      .select('*')
      .eq('id', trader_id)
      .single();

    if (traderError || !trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 });
    }

    // Check if trader has capacity (only if creating active position)
    if (status === 'active' && trader.current_copiers >= trader.max_copiers) {
      return NextResponse.json(
        { error: 'Trader is at full capacity' },
        { status: 400 }
      );
    }

    // Get user's USDT balance
    const { data: userBalance, error: balanceQueryError } = await supabase
      .from('user_balances')
      .select('id, balance, base_token_id, base_tokens!inner(id, symbol)')
      .eq('user_id', user_id)
      .eq('base_tokens.symbol', 'USDT')
      .single();

    if (balanceQueryError || !userBalance) {
      return NextResponse.json({ error: 'USDT balance not found' }, { status: 404 });
    }

    // Check balance
    // Extract base_token_id
    const baseToken = Array.isArray(userBalance.base_tokens)
      ? userBalance.base_tokens[0]
      : userBalance.base_tokens;

    if (!baseToken?.id) {
      return NextResponse.json(
        { error: 'Token configuration error' },
        { status: 500 }
      );
    }

    // Check for existing active position
    const { data: existingPosition } = await supabase
      .from('user_copy_positions')
      .select('id')
      .eq('user_id', user_id)
      .eq('trader_id', trader_id)
      .eq('status', 'active')
      .single();

    if (existingPosition) {
      return NextResponse.json(
        { error: 'User already has an active position with this trader' },
        { status: 400 }
      );
    }

    // Debit balance using database function (atomic operation with validation)
    const { data: balanceResult, error: balanceError } = await supabase.rpc(
      'update_user_balance',
      {
        p_user_id: user_id,
        p_base_token_id: baseToken.id,
        p_amount: parseFloat(allocation_usdt),
        p_operation: 'debit',
      }
    );

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      return NextResponse.json(
        { error: balanceError.message || 'Failed to update user balance' },
        { status: 500 }
      );
    }

    // Create copy position
    const { data: position, error: positionError } = await supabase
      .from('user_copy_positions')
      .insert({
        user_id,
        trader_id,
        allocation_usdt: parseFloat(allocation_usdt),
        current_pnl: 0,
        daily_pnl_rate: 0,
        status,
        started_at,
        stopped_at: status === 'stopped' ? started_at : null,
        final_pnl: status === 'stopped' ? 0 : null,
      })
      .select()
      .single();

    if (positionError) {
      // Rollback: credit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user_id,
        p_base_token_id: baseToken.id,
        p_amount: parseFloat(allocation_usdt),
        p_operation: 'credit',
      });

      console.error('Error creating copy position:', positionError);
      return NextResponse.json(
        { error: 'Failed to create copy position' },
        { status: 500 }
      );
    }

    const newBalance = parseFloat(balanceResult.balance);

    // Update trader stats (only if position is active)
    if (status === 'active') {
      const newCopiers = trader.current_copiers + 1;
      const newAum = parseFloat(trader.aum_usdt) + parseFloat(allocation_usdt);

      const { error: traderUpdateError } = await supabase
        .from('traders')
        .update({
          current_copiers: newCopiers,
          aum_usdt: newAum,
        })
        .eq('id', trader_id);

      if (traderUpdateError) {
        console.error('Error updating trader:', traderUpdateError);
        // Continue anyway - trader can be updated manually
      }
    }

    // Create related transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'copy_trade_start',
      amount: parseFloat(allocation_usdt),
      coin_symbol: 'USDT',
      status: 'completed',
      base_token_id: baseToken.id,
      notes: `Started copying ${trader.name}`,
      metadata: {
        trader_id,
        position_id: position.id,
        created_by_admin: user.id,
      },
      created_at: started_at,
      completed_at: started_at,
    });

    return NextResponse.json({
      success: true,
      position,
      new_balance: newBalance,
      trader_copiers: status === 'active' ? trader.current_copiers + 1 : trader.current_copiers,
      trader_aum: status === 'active' ? parseFloat(trader.aum_usdt) + parseFloat(allocation_usdt) : trader.aum_usdt,
    });
  } catch (error) {
    console.error('Admin create copy position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

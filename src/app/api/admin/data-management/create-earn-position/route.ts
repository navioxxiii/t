/**
 * Admin Create Earn Position API
 * POST /api/admin/data-management/create-earn-position
 * Manually create an earn position with balance deduction and vault updates
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
    const { user_id, vault_id, amount_usdt, invested_at, matures_at } = body;

    // Validate input
    if (!user_id || !vault_id || !amount_usdt) {
      return NextResponse.json(
        { error: 'User, vault, and amount are required' },
        { status: 400 }
      );
    }

    if (parseFloat(amount_usdt) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get vault details
    const { data: vault, error: vaultError } = await supabase
      .from('earn_vaults')
      .select('*')
      .eq('id', vault_id)
      .single();

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    // Validate amount against vault limits
    if (parseFloat(amount_usdt) < vault.min_amount) {
      return NextResponse.json(
        { error: `Amount is below minimum (${vault.min_amount})` },
        { status: 400 }
      );
    }

    if (vault.max_amount && parseFloat(amount_usdt) > vault.max_amount) {
      return NextResponse.json(
        { error: `Amount exceeds maximum (${vault.max_amount})` },
        { status: 400 }
      );
    }

    // Check capacity
    if (vault.total_capacity) {
      const newFilled = parseFloat(vault.current_filled) + parseFloat(amount_usdt);
      if (newFilled > vault.total_capacity) {
        return NextResponse.json(
          { error: 'Vault capacity exceeded' },
          { status: 400 }
        );
      }
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

    // Calculate daily profit rate
    const dailyProfitRate =
      (parseFloat(amount_usdt) * vault.apy_percent) / 100 / 365;

    // Debit balance using database function (atomic operation with validation)
    const { data: balanceResult, error: balanceError } = await supabase.rpc(
      'update_user_balance',
      {
        p_user_id: user_id,
        p_base_token_id: baseToken.id,
        p_amount: parseFloat(amount_usdt),
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

    // Create earn position
    const { data: position, error: positionError } = await supabase
      .from('user_earn_positions')
      .insert({
        user_id,
        vault_id,
        amount_usdt: parseFloat(amount_usdt),
        daily_profit_rate: dailyProfitRate,
        total_profit_usdt: 0,
        status: 'active',
        invested_at,
        matures_at,
      })
      .select()
      .single();

    if (positionError) {
      // Rollback: credit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user_id,
        p_base_token_id: baseToken.id,
        p_amount: parseFloat(amount_usdt),
        p_operation: 'credit',
      });

      console.error('Error creating earn position:', positionError);
      return NextResponse.json(
        { error: 'Failed to create earn position' },
        { status: 500 }
      );
    }

    const newBalance = parseFloat(balanceResult.balance);

    // Update vault capacity
    const newFilled = parseFloat(vault.current_filled) + parseFloat(amount_usdt);
    const updateData: { current_filled: number; status?: string } = { current_filled: newFilled };

    // Update status if capacity reached
    if (vault.total_capacity && newFilled >= vault.total_capacity) {
      updateData.status = 'sold_out';
    }

    const { error: vaultUpdateError } = await supabase
      .from('earn_vaults')
      .update(updateData)
      .eq('id', vault_id);

    if (vaultUpdateError) {
      console.error('Error updating vault:', vaultUpdateError);
      // Continue anyway - vault can be updated manually
    }

    // Create related transaction
    await supabase.from('transactions').insert({
      user_id,
      type: 'earn_invest',
      amount: parseFloat(amount_usdt),
      coin_symbol: 'USDT',
      status: 'completed',
      base_token_id: baseToken.id,
      notes: `Invested in ${vault.title}`,
      metadata: {
        vault_id,
        position_id: position.id,
        created_by_admin: user.id,
      },
      created_at: invested_at,
      completed_at: invested_at,
    });

    return NextResponse.json({
      success: true,
      position,
      new_balance: newBalance,
      vault_filled: newFilled,
    });
  } catch (error) {
    console.error('Admin create earn position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

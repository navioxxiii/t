/**
 * Admin Create Transaction API
 * POST /api/admin/data-management/create-transaction
 * Manually create a transaction with automatic balance updates
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
    const {
      user_id,
      type,
      coin_symbol,
      amount,
      status,
      tx_hash,
      to_address,
      from_address,
      network_fee,
      notes,
      created_at,
    } = body;

    // Validate input
    if (!user_id || !type || !coin_symbol || !amount) {
      return NextResponse.json(
        { error: 'User, type, coin, and amount are required' },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user's balance for this token
    const { data: userBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('id, balance, base_token_id, base_tokens!inner(id, symbol)')
      .eq('user_id', user_id)
      .eq('base_tokens.symbol', coin_symbol)
      .single();

    if (balanceError || !userBalance) {
      return NextResponse.json(
        { error: `Balance not found for ${coin_symbol}` },
        { status: 404 }
      );
    }

    // Determine operation type
    const amountNum = parseFloat(amount);
    const isDeposit = ['deposit', 'earn_claim'].includes(type);
    const isWithdrawal = ['withdrawal', 'earn_invest', 'copy_trade_start'].includes(type);

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type,
        amount: amountNum,
        coin_symbol,
        status,
        tx_hash: tx_hash || null,
        to_address: to_address || null,
        from_address: from_address || null,
        network_fee: network_fee ? parseFloat(network_fee) : null,
        notes: notes || null,
        base_token_id: userBalance.base_token_id,
        metadata: {
          created_by_admin: user.id,
          admin_email: profile.role,
        },
        created_at,
        completed_at: status === 'completed' ? created_at : null,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Update user balance if transaction is completed
    let newBalance = parseFloat(String(userBalance.balance));
    if (status === 'completed' && (isDeposit || isWithdrawal)) {
      const operation = isDeposit ? 'credit' : 'debit';

      const { data: balanceResult, error: balanceUpdateError } = await supabase.rpc(
        'update_user_balance',
        {
          p_user_id: user_id,
          p_base_token_id: userBalance.base_token_id,
          p_amount: amountNum,
          p_operation: operation,
        }
      );

      if (balanceUpdateError) {
        console.error('Error updating user balance:', balanceUpdateError);
        return NextResponse.json(
          { error: balanceUpdateError.message || 'Failed to update user balance' },
          { status: 500 }
        );
      }

      newBalance = parseFloat(balanceResult.balance);
    }

    return NextResponse.json({
      success: true,
      transaction,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Admin create transaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

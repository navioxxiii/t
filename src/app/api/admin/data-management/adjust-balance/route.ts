/**
 * Admin Balance Adjustment API
 * POST - Manually adjust user balance with audit trail
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

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
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_email, base_token_code, adjustment_amount, adjustment_type, reason, notes } = body;

    // Validation
    if (!user_email || !base_token_code || !adjustment_amount || !adjustment_type || !reason) {
      return NextResponse.json(
        { error: 'User email, token, amount, type, and reason are required' },
        { status: 400 }
      );
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get base token
    const { data: baseToken } = await supabase
      .from('base_tokens')
      .select('id, symbol')
      .eq('code', base_token_code)
      .single();

    if (!baseToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Get current balance
    const { data: currentBalance } = await supabase
      .from('user_balances')
      .select('balance, locked_balance')
      .eq('user_id', targetUser.id)
      .eq('base_token_id', baseToken.id)
      .single();

    const currentTotal = currentBalance ? parseFloat(currentBalance.balance) : 0;
    const locked = currentBalance ? parseFloat(currentBalance.locked_balance) : 0;

    // Calculate new balance
    const adjustmentAmountNum = parseFloat(adjustment_amount);
    const newBalance =
      adjustment_type === 'add'
        ? currentTotal + adjustmentAmountNum
        : currentTotal - adjustmentAmountNum;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Adjustment would result in negative balance' },
        { status: 400 }
      );
    }

    // Update balance
    const { error: balanceError } = await supabase
      .from('user_balances')
      .upsert({
        user_id: targetUser.id,
        base_token_id: baseToken.id,
        balance: newBalance.toString(),
        locked_balance: locked.toString(),
        updated_at: new Date().toISOString(),
      });

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Create transaction record for audit trail
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: targetUser.id,
      type: 'admin_adjustment',
      status: 'completed',
      amount_usd: adjustment_type === 'add' ? adjustmentAmountNum : -adjustmentAmountNum,
      created_at: new Date().toISOString(),
    });

    if (txError) {
      console.error('Error creating transaction record:', txError);
    }

    // Log admin action
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'balance_adjustment',
      target_user_id: targetUser.id,
      target_user_email: targetUser.email,
      details: {
        base_token_code,
        adjustment_type,
        adjustment_amount: adjustmentAmountNum,
        old_balance: currentTotal,
        new_balance: newBalance,
        reason,
        notes,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      old_balance: currentTotal,
      adjustment: adjustment_type === 'add' ? adjustmentAmountNum : -adjustmentAmountNum,
    }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

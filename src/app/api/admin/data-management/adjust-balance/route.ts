/**
 * Admin Balance Adjustment API
 * POST - Manually adjust user balance with audit trail
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

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
    const { user_email, base_token_code, adjustment_amount, adjustment_type, reason, notes, create_transaction = true } = body;

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
console.log(`[Admin Adjustment] Current balance for ${targetUser.email} (${baseToken.symbol}): ${currentTotal} (locked: ${locked})`);
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

    // Update balance (use admin client to bypass RLS)
    const { error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: targetUser.id,
        base_token_id: baseToken.id,
        balance: newBalance.toString(),
        locked_balance: locked.toString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,base_token_id' });

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Create transaction record for audit trail (optional)
    if (create_transaction) {
      const { error: txError } = await supabaseAdmin.from('transactions').insert({
        user_id: targetUser.id,
        type: adjustment_type === 'add' ? 'deposit' : 'withdrawal',
        amount: adjustmentAmountNum,
        coin_symbol: baseToken.symbol,
        status: 'completed',
        notes: `Admin balance adjustment: ${reason}. ${notes || ''}`.trim(),
        base_token_id: baseToken.id,
        metadata: { admin_adjustment: true, admin_id: user.id, admin_email: profile.email, reason },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      if (txError) {
        console.error('Error creating transaction record:', txError);
        // Don't fail the operation if transaction record fails
      }
    }

    // Log admin action
    await supabaseAdmin.from('admin_action_logs').insert({
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

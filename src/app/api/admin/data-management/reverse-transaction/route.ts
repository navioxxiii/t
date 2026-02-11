/**
 * Admin Reverse Transaction API
 * POST - Reverse/undo an erroneous transaction with compensating entry
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
    const { transaction_id, reason, notes } = body;

    // Validation
    if (!transaction_id || !reason) {
      return NextResponse.json(
        { error: 'Transaction ID and reason are required' },
        { status: 400 }
      );
    }

    // Get original transaction
    const { data: originalTx, error: txError } = await supabase
      .from('transactions')
      .select('*, profiles(email)')
      .eq('id', transaction_id)
      .single();

    if (txError || !originalTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if already cancelled/reversed
    if (originalTx.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Transaction has already been reversed' },
        { status: 400 }
      );
    }

    // Mark original transaction as cancelled (use admin client to bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'cancelled',
      })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // Create compensating transaction (opposite type)
    const reversalType = originalTx.type === 'deposit' ? 'withdrawal' : 'deposit';
    const { data: reversalTx, error: reversalError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: originalTx.user_id,
        type: reversalType,
        amount: originalTx.amount,
        coin_symbol: originalTx.coin_symbol,
        status: 'completed',
        notes: `Reversal of transaction ${transaction_id}. Reason: ${reason}`,
        base_token_id: originalTx.base_token_id,
        metadata: { reversal: true, original_transaction_id: transaction_id, admin_id: user.id },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reversalError) {
      console.error('Error creating reversal transaction:', reversalError);
      return NextResponse.json({ error: 'Failed to create reversal transaction' }, { status: 500 });
    }

    // Reverse the balance effect of the original transaction
    if (originalTx.status === 'completed' && originalTx.base_token_id) {
      const isOriginalDeposit = ['deposit', 'earn_claim'].includes(originalTx.type);
      const isOriginalWithdrawal = ['withdrawal', 'earn_invest', 'copy_trade_start'].includes(originalTx.type);

      if (isOriginalDeposit || isOriginalWithdrawal) {
        // Reverse: if original was deposit (credit), now debit; if withdrawal (debit), now credit
        const operation = isOriginalDeposit ? 'debit' : 'credit';

        await supabaseAdmin.rpc('update_user_balance', {
          p_user_id: originalTx.user_id,
          p_base_token_id: originalTx.base_token_id,
          p_amount: parseFloat(originalTx.amount),
          p_operation: operation,
        });
      }
    }

    // Log admin action
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'transaction_reversal',
      target_user_id: originalTx.user_id,
      target_user_email: originalTx.profiles?.email,
      details: {
        original_transaction_id: transaction_id,
        reversal_transaction_id: reversalTx.id,
        original_amount: originalTx.amount,
        original_type: originalTx.type,
        reason,
        notes,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      original_transaction: originalTx,
      reversal_transaction: reversalTx,
    }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

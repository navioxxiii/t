/**
 * Admin Reverse Transaction API
 * POST - Reverse/undo an erroneous transaction with compensating entry
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

    // Check if already reversed
    if (originalTx.status === 'reversed') {
      return NextResponse.json(
        { error: 'Transaction has already been reversed' },
        { status: 400 }
      );
    }

    // Mark original transaction as reversed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'reversed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // Create compensating transaction (opposite sign)
    const { data: reversalTx, error: reversalError } = await supabase
      .from('transactions')
      .insert({
        user_id: originalTx.user_id,
        type: 'reversal',
        status: 'completed',
        amount_usd: -originalTx.amount_usd, // Opposite sign
        original_transaction_id: transaction_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reversalError) {
      console.error('Error creating reversal transaction:', reversalError);
      return NextResponse.json({ error: 'Failed to create reversal transaction' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'transaction_reversal',
      target_user_id: originalTx.user_id,
      target_user_email: originalTx.profiles?.email,
      details: {
        original_transaction_id: transaction_id,
        reversal_transaction_id: reversalTx.id,
        original_amount: originalTx.amount_usd,
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

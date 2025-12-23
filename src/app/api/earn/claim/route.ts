/**
 * POST /api/earn/claim
 * Claim matured position - credit principal + profit to wallet
 * Only allows claiming matured positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EARN_ENABLED } from '@/lib/feature-flags';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    if (!EARN_ENABLED) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { positionId } = body;

    if (!positionId) {
      return NextResponse.json(
        { error: 'Missing position ID' },
        { status: 400 }
      );
    }

    // Fetch position with vault details
    const { data: position, error: positionError } = await supabase
      .from('user_earn_positions')
      .select(`
        *,
        vault:earn_vaults(*)
      `)
      .eq('id', positionId)
      .eq('user_id', user.id)
      .single();

    if (positionError || !position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Validate position status
    if (position.status !== 'matured') {
      return NextResponse.json(
        { error: 'Position is not matured yet' },
        { status: 400 }
      );
    }

    if (position.withdrawn_at) {
      return NextResponse.json(
        { error: 'Position already withdrawn' },
        { status: 400 }
      );
    }

    // Get USDT base token ID
    const { data: usdtToken, error: tokenError } = await supabase
      .from('base_tokens')
      .select('id')
      .eq('code', 'usdt')
      .single();

    if (tokenError || !usdtToken) {
      return NextResponse.json(
        { error: 'USDT token not configured' },
        { status: 500 }
      );
    }

    const USDT_BASE_TOKEN_ID = usdtToken.id;

    // Calculate payout amount: principal + profit
    const principal = Number(position.amount_usdt);
    const profit = Number(position.total_profit_usdt);
    const totalPayout = principal + profit;

    // ──── TRANSACTION: Credit balance + Mark position withdrawn ────

    // 1. Credit user's USDT balance
    const { error: creditError } = await supabase.rpc('update_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
      p_amount: totalPayout,
      p_operation: 'credit',
    });

    if (creditError) {
      console.error('Failed to credit balance:', creditError);
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // 2. Mark position as withdrawn
    const { error: markWithdrawnError } = await supabase
      .from('user_earn_positions')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', positionId);

    if (markWithdrawnError) {
      // Rollback: Debit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_base_token_id: USDT_BASE_TOKEN_ID,
        p_amount: totalPayout,
        p_operation: 'debit',
      });

      console.error('Failed to update position status:', markWithdrawnError);
      return NextResponse.json(
        { error: 'Failed to mark position as withdrawn' },
        { status: 500 }
      );
    }

    // 3. Record transaction with new schema
    const { error: transactionError } = await adminSupabase.from('transactions').insert({
      user_id: user.id,
      base_token_id: USDT_BASE_TOKEN_ID,
      type: 'earn_claim',
      coin_symbol: 'USDT', // Keep for backward compatibility
      amount: totalPayout.toString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        position_id: positionId,
        vault_id: position.vault_id,
        vault_title: position.vault?.title,
        principal,
        profit,
        total_payout: totalPayout,
      },
    });

    if (transactionError) {
      console.error('Failed to record earn claim transaction:', transactionError);
      // Don't fail the request - funds were already transferred
    }

    // Get updated balance
    const { data: newBalanceData } = await supabase.rpc('get_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
    });

    const newBalance = newBalanceData?.balance || 0;

    // TODO: Send email notification to user about earn claim completed
    // Template needed: EarnClaimCompletedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendEarnClaimCompletedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     vaultTitle: position.vault?.title || 'Earn Vault',
    //     principal,
    //     profit,
    //     totalPayout,
    //   });
    // }

    return NextResponse.json({
      success: true,
      payout: {
        principal,
        profit,
        total: totalPayout,
      },
      new_balance: newBalance,
      message: `Successfully claimed ${totalPayout.toFixed(2)} USDT`,
    });

  } catch (error) {
    console.error('Earn claim API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

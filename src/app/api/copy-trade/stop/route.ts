/**
 * POST /api/copy-trade/stop
 * Stop copying a trader - calculate performance fee, credit wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COPY_TRADE_ENABLED } from '@/lib/feature-flags';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    if (!COPY_TRADE_ENABLED) {
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

    // Fetch position with trader details
    const { data: position, error: positionError } = await supabase
      .from('user_copy_positions')
      .select(`
        *,
        trader:traders(*)
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
    if (position.status !== 'active') {
      return NextResponse.json(
        { error: 'Position is not active' },
        { status: 400 }
      );
    }

    const trader = position.trader;
    if (!trader) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
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

    // ──── PERFORMANCE FEE CALCULATION ────
    const allocation = Number(position.allocation_usdt);
    const pnl = Number(position.current_pnl);
    const totalValue = allocation + pnl;

    // Only charge performance fee on profits
    const profit = pnl > 0 ? pnl : 0;
    const performanceFeePercent = Number(trader.performance_fee_percent);
    const traderFee = profit * (performanceFeePercent / 100);
    const userProfitAfterFee = profit - traderFee;

    // User receives: allocation + (profit - fee)
    const userReceives = allocation + userProfitAfterFee;

    // ──── TRANSACTION: Credit balance + Update position + Update trader ────

    // 1. Credit user's USDT balance
    const { error: creditError } = await supabase.rpc('update_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
      p_amount: userReceives,
      p_operation: 'credit',
    });

    if (creditError) {
      console.error('Failed to credit balance:', creditError);
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // 2. Update position to stopped
    const { error: stopPositionError } = await supabase
      .from('user_copy_positions')
      .update({
        status: 'stopped',
        stopped_at: new Date().toISOString(),
        final_pnl: userProfitAfterFee,
        performance_fee_paid: traderFee,
      })
      .eq('id', positionId);

    if (stopPositionError) {
      // Rollback: Debit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_base_token_id: USDT_BASE_TOKEN_ID,
        p_amount: userReceives,
        p_operation: 'debit',
      });

      console.error('Failed to update position:', stopPositionError);
      return NextResponse.json(
        { error: 'Failed to stop position' },
        { status: 500 }
      );
    }

    // 3. Update trader stats
    const currentCopiers = Number(trader.current_copiers);
    const newCopiers = Math.max(0, currentCopiers - 1);
    const currentAum = Number(trader.aum_usdt);
    const newAum = Math.max(0, currentAum - allocation);
    const currentEarnings = Number(trader.lifetime_earnings_usdt);
    const newEarnings = currentEarnings + traderFee;

    const { error: traderUpdateError } = await supabase
      .from('traders')
      .update({
        current_copiers: newCopiers,
        aum_usdt: newAum,
        lifetime_earnings_usdt: newEarnings,
      })
      .eq('id', trader.id);

    if (traderUpdateError) {
      console.error('Failed to update trader stats:', traderUpdateError);
      // Non-critical - position was stopped successfully
    }

    // 4. Record transaction with new schema
    const { error: transactionError } = await adminSupabase.from('transactions').insert({
      user_id: user.id,
      base_token_id: USDT_BASE_TOKEN_ID,
      type: 'copy_trade_stop',
      coin_symbol: 'USDT', // Keep for backward compatibility
      amount: userReceives.toString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        position_id: positionId,
        trader_id: trader.id,
        trader_name: trader.name,
        allocation,
        pnl,
        profit,
        trader_fee: traderFee,
        user_profit_after_fee: userProfitAfterFee,
        total_returned: userReceives,
      },
    });

    if (transactionError) {
      console.error('Failed to record copy trade stop transaction:', transactionError);
      // Don't fail the request - funds were already transferred
    }

    // Get updated balance
    const { data: newBalanceData } = await supabase.rpc('get_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
    });

    const newBalance = newBalanceData?.balance || 0;

    // TODO: Send email notification to user about copy trade stopped
    // Template needed: CopyTradeStoppedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendCopyTradeStoppedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     traderName: trader.name,
    //     allocation,
    //     profit,
    //     traderFee,
    //     totalReceived: userReceives,
    //   });
    // }

    return NextResponse.json({
      success: true,
      payout: {
        allocation,
        pnl,
        profit,
        trader_fee: traderFee,
        user_profit_after_fee: userProfitAfterFee,
        total: userReceives,
      },
      new_balance: newBalance,
      message: `Successfully stopped copying ${trader.name}. Received ${userReceives.toFixed(2)} USDT`,
    });
  } catch (error) {
    console.error('Copy-trade stop API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

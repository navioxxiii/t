/**
 * POST /api/copy-trade/start
 * Start copying a trader - debit wallet, create position
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COPY_TRADE_ENABLED } from '@/lib/feature-flags';
import { createAdminClient } from '@/lib/supabase/admin';
import { initializeSimulationParams } from '@/lib/copy-trade/pnl-simulator';

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
    const { traderId, amount } = body;

    // Validation
    if (!traderId || !amount) {
      return NextResponse.json(
        { error: 'Missing trader ID or amount' },
        { status: 400 }
      );
    }

    const allocationAmount = parseFloat(amount);
    if (isNaN(allocationAmount) || allocationAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid allocation amount' },
        { status: 400 }
      );
    }

    // Fetch trader details
    const { data: trader, error: traderError } = await supabase
      .from('traders')
      .select('*')
      .eq('id', traderId)
      .single();

    if (traderError || !trader) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Check if trader is full
    const currentCopiers = Number(trader.current_copiers) || 0;
    const maxCopiers = Number(trader.max_copiers);

    if (currentCopiers >= maxCopiers) {
      return NextResponse.json(
        { error: 'Trader capacity is full. Join the waitlist instead.' },
        { status: 400 }
      );
    }

    // Check if user already has an active position with this trader
    const { data: existingPosition } = await supabase
      .from('user_copy_positions')
      .select('id')
      .eq('user_id', user.id)
      .eq('trader_id', traderId)
      .eq('status', 'active')
      .single();

    if (existingPosition) {
      return NextResponse.json(
        { error: 'You are already copying this trader' },
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

    // Get user's USDT balance
    const { data: balanceData, error: balanceError } = await supabase.rpc(
      'get_user_balance',
      {
        p_user_id: user.id,
        p_base_token_id: USDT_BASE_TOKEN_ID,
      }
    );

    if (balanceError) {
      console.error('Failed to get USDT balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to check balance' },
        { status: 500 }
      );
    }

    const availableBalance = parseFloat(balanceData.available_balance || 0);
    if (availableBalance < allocationAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient available USDT balance',
          available: availableBalance,
          requested: allocationAmount,
          locked: parseFloat(balanceData.locked_balance || 0),
        },
        { status: 400 }
      );
    }

    // Initialize simulation parameters for realistic P&L
    const simulationParams = initializeSimulationParams(
      {
        historical_roi_min: Number(trader.historical_roi_min),
        historical_roi_max: Number(trader.historical_roi_max),
        risk_level: trader.risk_level,
        max_drawdown: Number(trader.max_drawdown),
      },
      allocationAmount
    );

    // ──── TRANSACTION: Debit balance + Create position + Update trader ────

    // 1. Debit user's USDT balance
    const { error: debitError } = await supabase.rpc('update_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
      p_amount: allocationAmount,
      p_operation: 'debit',
    });

    if (debitError) {
      console.error('Failed to debit balance:', debitError);
      return NextResponse.json(
        { error: 'Failed to process allocation' },
        { status: 500 }
      );
    }

    // 2. Create copy position with simulation params
    const { data: position, error: positionError } = await supabase
      .from('user_copy_positions')
      .insert({
        user_id: user.id,
        trader_id: traderId,
        allocation_usdt: allocationAmount,
        current_pnl: 0,
        daily_pnl_rate: 0, // Deprecated - kept for backward compatibility
        simulation_params: simulationParams,
        status: 'active',
      })
      .select()
      .single();

    if (positionError) {
      // Rollback: Credit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_base_token_id: USDT_BASE_TOKEN_ID,
        p_amount: allocationAmount,
        p_operation: 'credit',
      });

      console.error('Failed to create position:', positionError);
      return NextResponse.json(
        { error: 'Failed to create copy position' },
        { status: 500 }
      );
    }

    // 3. Update trader stats
    const newCopiers = currentCopiers + 1;
    const newAum = Number(trader.aum_usdt) + allocationAmount;

    const { error: traderUpdateError } = await supabase
      .from('traders')
      .update({
        current_copiers: newCopiers,
        aum_usdt: newAum,
      })
      .eq('id', traderId);

    if (traderUpdateError) {
      console.error('Failed to update trader stats:', traderUpdateError);
      // Non-critical - position is created successfully
    }

    // 4. Record transaction with new schema
    const { error: transactionError } = await adminSupabase.from('transactions').insert({
      user_id: user.id,
      base_token_id: USDT_BASE_TOKEN_ID,
      type: 'copy_trade_start',
      coin_symbol: 'USDT', // Keep for backward compatibility
      amount: allocationAmount.toString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        trader_id: traderId,
        trader_name: trader.name,
        position_id: position.id,
        allocation: allocationAmount,
      },
    });

    if (transactionError) {
      console.error('Failed to record copy trade start transaction:', transactionError);
      // Don't fail the request - position was created successfully
    }

    // TODO: Send email notification to user about copy trade started
    // Template needed: CopyTradeStartedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendCopyTradeStartedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     traderName: trader.name,
    //     allocationAmount,
    //     dailyPnlRate,
    //   });
    // }

    return NextResponse.json({
      success: true,
      position: {
        ...position,
        trader,
      },
      message: `Successfully started copying ${trader.name} with ${allocationAmount} USDT`,
    });
  } catch (error) {
    console.error('Copy-trade start API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

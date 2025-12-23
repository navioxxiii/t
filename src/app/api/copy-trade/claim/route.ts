/**
 * GET & POST /api/copy-trade/claim
 * Validate and process waitlist claim from email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COPY_TRADE_ENABLED } from '@/lib/feature-flags';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET - Validate claim token and return trader info
 */
export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!COPY_TRADE_ENABLED) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing claim token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find waitlist entry by token
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('trader_waitlist')
      .select(`
        *,
        trader:traders(*)
      `)
      .eq('claim_token', token)
      .eq('status', 'notified')
      .single();

    if (waitlistError || !waitlistEntry) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }

    // Check if claim has expired
    const expiresAt = new Date(waitlistEntry.claim_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Claim window has expired' },
        { status: 410 }
      );
    }

    // Calculate time remaining
    const hoursRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(((expiresAt.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      success: true,
      waitlist_entry: waitlistEntry,
      trader: waitlistEntry.trader,
      expires_at: expiresAt.toISOString(),
      time_remaining: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
      },
    });
  } catch (error) {
    console.error('Claim validation API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Process claim and start copying
 */
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
    const { token, amount } = body;

    if (!token || !amount) {
      return NextResponse.json(
        { error: 'Missing token or amount' },
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

    // Find waitlist entry
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('trader_waitlist')
      .select(`
        *,
        trader:traders(*)
      `)
      .eq('claim_token', token)
      .eq('user_id', user.id)
      .eq('status', 'notified')
      .single();

    if (waitlistError || !waitlistEntry) {
      return NextResponse.json(
        { error: 'Invalid or expired claim' },
        { status: 404 }
      );
    }

    // Check expiry
    const expiresAt = new Date(waitlistEntry.claim_expires_at);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'Claim window has expired' },
        { status: 410 }
      );
    }

    const trader = waitlistEntry.trader;
    if (!trader) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Check trader capacity (someone might have claimed first)
    const currentCopiers = Number(trader.current_copiers);
    const maxCopiers = Number(trader.max_copiers);

    if (currentCopiers >= maxCopiers) {
      return NextResponse.json(
        { error: 'Trader capacity filled by another user' },
        { status: 400 }
      );
    }

    // Get user's USDT balance
    const { data: userBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('id, balance, base_tokens!inner(id, symbol)')
      .eq('user_id', user.id)
      .eq('base_tokens.symbol', 'USDT')
      .single();

    if (balanceError || !userBalance) {
      return NextResponse.json(
        { error: 'USDT balance not found' },
        { status: 404 }
      );
    }

    // Extract base_token_id for RPC calls
    const baseToken = Array.isArray(userBalance.base_tokens)
      ? userBalance.base_tokens[0]
      : userBalance.base_tokens;

    if (!baseToken?.id) {
      return NextResponse.json(
        { error: 'Token configuration error' },
        { status: 500 }
      );
    }

    // Calculate daily PnL rate
    const monthlyRoiTarget = (Number(trader.historical_roi_min) + Number(trader.historical_roi_max)) / 2;
    const dailyRoiTarget = monthlyRoiTarget / 30;
    const dailyPnlRate = allocationAmount * (dailyRoiTarget / 100);

    // ──── TRANSACTION: Debit balance + Create position + Update trader + Mark claim ────

    // 1. Debit balance using database function (atomic operation)
    const { data: balanceData, error: updateBalanceError } = await supabase.rpc(
      'update_user_balance',
      {
        p_user_id: user.id,
        p_base_token_id: baseToken.id,
        p_amount: allocationAmount,
        p_operation: 'debit',
      }
    );

    if (updateBalanceError) {
      console.error('Failed to debit balance:', updateBalanceError);
      return NextResponse.json(
        { error: updateBalanceError.message || 'Failed to process allocation' },
        { status: 500 }
      );
    }

    // 2. Create copy position
    const { data: position, error: positionError } = await supabase
      .from('user_copy_positions')
      .insert({
        user_id: user.id,
        trader_id: trader.id,
        allocation_usdt: allocationAmount,
        current_pnl: 0,
        daily_pnl_rate: dailyPnlRate,
        status: 'active',
      })
      .select()
      .single();

    if (positionError) {
      // Rollback balance using database function
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_base_token_id: baseToken.id,
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

    await supabase
      .from('traders')
      .update({
        current_copiers: newCopiers,
        aum_usdt: newAum,
      })
      .eq('id', trader.id);

    // 4. Mark waitlist as claimed
    await supabase
      .from('trader_waitlist')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', waitlistEntry.id);

    // 5. Record transaction
    await adminSupabase.from('transactions').insert({
      user_id: user.id,
      type: 'copy_trade_start',
      coin_symbol: 'USDT',
      amount: allocationAmount,
      status: 'completed',
      completed_at: new Date().toISOString(),
      base_token_id: baseToken?.id,
      metadata: {
        trader_id: trader.id,
        trader_name: trader.name,
        position_id: position.id,
        allocation: allocationAmount,
        claimed_from_waitlist: true,
      },
    });

    // TODO: Send email notification to user about copy trade claim (spot claimed from waitlist)
    // Template needed: CopyTradeClaimedEmail (similar to CopyTradeStartedEmail but mentions waitlist)
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendCopyTradeClaimedEmail({
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
      message: `Successfully claimed spot and started copying ${trader.name}`,
    });
  } catch (error) {
    console.error('Claim process API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

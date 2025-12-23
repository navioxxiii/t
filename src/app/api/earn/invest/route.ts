/**
 * POST /api/earn/invest
 * Lock USDT into an earn vault
 * Creates position with pre-calculated daily profit rate
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
    const { vaultId, amount } = body;

    // Validation
    if (!vaultId || !amount) {
      return NextResponse.json(
        { error: 'Missing vault ID or amount' },
        { status: 400 }
      );
    }

    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid investment amount' },
        { status: 400 }
      );
    }

    // Fetch vault details
    const { data: vault, error: vaultError } = await supabase
      .from('earn_vaults')
      .select('*')
      .eq('id', vaultId)
      .eq('status', 'active')
      .single();

    if (vaultError || !vault) {
      return NextResponse.json(
        { error: 'Vault not found or inactive' },
        { status: 404 }
      );
    }

    // Validate investment amount against vault limits
    if (investmentAmount < Number(vault.min_amount)) {
      return NextResponse.json(
        { error: `Minimum investment is ${vault.min_amount} USDT` },
        { status: 400 }
      );
    }

    if (vault.max_amount && investmentAmount > Number(vault.max_amount)) {
      return NextResponse.json(
        { error: `Maximum investment is ${vault.max_amount} USDT` },
        { status: 400 }
      );
    }

    // Check vault capacity
    const currentFilled = Number(vault.current_filled) || 0;
    const totalCapacity = vault.total_capacity ? Number(vault.total_capacity) : null;

    if (totalCapacity && currentFilled + investmentAmount > totalCapacity) {
      return NextResponse.json(
        { error: 'Insufficient vault capacity' },
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
    if (availableBalance < investmentAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient available USDT balance',
          available: availableBalance,
          requested: investmentAmount,
          locked: parseFloat(balanceData.locked_balance || 0),
        },
        { status: 400 }
      );
    }

    // Calculate profit parameters
    const apyPercent = Number(vault.apy_percent);
    const durationMonths = Number(vault.duration_months);
    const durationDays = Math.round(durationMonths * 30.44); // Average days per month

    // Total profit = principal × (APY/100) × (months/12)
    const totalProfit = investmentAmount * (apyPercent / 100) * (durationMonths / 12);

    // Daily profit rate for smooth increment display
    const dailyProfitRate = totalProfit / durationDays;

    // Calculate maturity date
    const matureDate = new Date();
    matureDate.setMonth(matureDate.getMonth() + durationMonths);

    // ──── TRANSACTION: Debit balance + Create position + Update vault ────

    // 1. Debit user's USDT balance
    const { error: debitError } = await supabase.rpc('update_user_balance', {
      p_user_id: user.id,
      p_base_token_id: USDT_BASE_TOKEN_ID,
      p_amount: investmentAmount,
      p_operation: 'debit',
    });

    if (debitError) {
      console.error('Failed to debit balance:', debitError);
      return NextResponse.json(
        { error: 'Failed to process investment' },
        { status: 500 }
      );
    }

    // 2. Create earn position
    const { data: position, error: positionError } = await supabase
      .from('user_earn_positions')
      .insert({
        user_id: user.id,
        vault_id: vaultId,
        amount_usdt: investmentAmount,
        daily_profit_rate: dailyProfitRate,
        total_profit_usdt: totalProfit,
        status: 'active',
        matures_at: matureDate.toISOString(),
      })
      .select()
      .single();

    if (positionError) {
      // Rollback: Credit balance back
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_base_token_id: USDT_BASE_TOKEN_ID,
        p_amount: investmentAmount,
        p_operation: 'credit',
      });

      console.error('Failed to create position:', positionError);
      return NextResponse.json(
        { error: 'Failed to create investment position' },
        { status: 500 }
      );
    }

    // 3. Update vault's filled amount
    const { error: vaultUpdateError } = await supabase
      .from('earn_vaults')
      .update({ current_filled: currentFilled + investmentAmount })
      .eq('id', vaultId);

    if (vaultUpdateError) {
      console.error('Failed to update vault capacity:', vaultUpdateError);
      // Note: Position is created, but capacity counter may be slightly off
      // This is acceptable for non-critical feature
    }

    // 4. Record transaction with new schema
    const { error: transactionError } = await adminSupabase.from('transactions').insert({
      user_id: user.id,
      base_token_id: USDT_BASE_TOKEN_ID,
      type: 'earn_invest',
      coin_symbol: 'USDT', // Keep for backward compatibility
      amount: investmentAmount.toString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        vault_id: vaultId,
        vault_title: vault.title,
        position_id: position.id,
        apy: apyPercent,
        duration_months: durationMonths,
        matures_at: matureDate.toISOString(),
      },
    });

    if (transactionError) {
      console.error('Failed to record earn invest transaction:', transactionError);
      // Don't fail the request - position was created successfully
    }

    // TODO: Send email notification to user about earn investment started
    // Template needed: EarnInvestmentStartedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendEarnInvestmentStartedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     vaultTitle: vault.title,
    //     investmentAmount,
    //     apyPercent,
    //     durationMonths,
    //     totalProfit,
    //     matureDate: matureDate.toISOString(),
    //   });
    // }

    return NextResponse.json({
      success: true,
      position: {
        ...position,
        vault,
      },
      message: `Successfully invested ${investmentAmount} USDT`,
    });

  } catch (error) {
    console.error('Earn invest API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

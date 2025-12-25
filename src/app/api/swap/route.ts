import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  formatSwapTransaction,
  SWAP_FEE_PERCENTAGE,
  MINIMUM_SWAP_USD,
} from '@/lib/binance/swap';
import { canUserTransact, recordTransaction } from '@/lib/kyc/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { fromCoin, toCoin, fromAmount, estimate } = body;

    // Validate input
    if (!fromCoin || !toCoin || !fromAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate estimate
    if (!estimate || !estimate.estimatedAt) {
      return NextResponse.json(
        { error: 'Missing or invalid estimate' },
        { status: 400 }
      );
    }

    // Validate estimate freshness (< 60 seconds)
    const estimateAge = Date.now() - new Date(estimate.estimatedAt).getTime();
    if (estimateAge > 60000) {
      return NextResponse.json(
        { error: 'Exchange rate expired. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // ──── KYC CHECK ────
    // Check if user has KYC approval and is within transaction limits
    const estimatedValueUsd = estimate.fromValueUsd || amount * (estimate.fromPrice || 0);
    const kycCheck = await canUserTransact(adminClient, user.id, estimatedValueUsd, 'swap');

    if (!kycCheck.allowed) {
      return NextResponse.json(
        {
          error: kycCheck.reason,
          requires_kyc: true,
          current_tier: kycCheck.tier,
          remaining_limit: kycCheck.remaining_limit,
        },
        { status: 403 }
      );
    }

    // Validate estimate matches request
    if (
      estimate.fromCoin !== fromCoin ||
      estimate.toCoin !== toCoin ||
      Math.abs(estimate.fromAmount - amount) > 0.00000001
    ) {
      return NextResponse.json(
        { error: 'Estimate parameters do not match request' },
        { status: 400 }
      );
    }

    // Verify fee percentage integrity
    if (Math.abs(estimate.feePercentage - SWAP_FEE_PERCENTAGE) > 0.01) {
      return NextResponse.json(
        { error: 'Invalid fee percentage' },
        { status: 400 }
      );
    }

    // Check minimum swap amount
    if (estimate.totalUsdValue < MINIMUM_SWAP_USD) {
      return NextResponse.json(
        { error: `Minimum swap amount is $${MINIMUM_SWAP_USD} USD` },
        { status: 400 }
      );
    }

    // Get base tokens directly (frontend sends base_tokens.symbol like 'BTC', 'ETH', 'USDT')
    const { data: fromToken, error: fromError } = await adminClient
      .from('base_tokens')
      .select('id, code, symbol, name')
      .eq('symbol', fromCoin)
      .single();

    const { data: toToken, error: toError } = await adminClient
      .from('base_tokens')
      .select('id, code, symbol, name')
      .eq('symbol', toCoin)
      .single();

    if (fromError || toError || !fromToken || !toToken) {
      console.error('Error fetching base tokens:', { fromError, toError });
      return NextResponse.json(
        { error: 'Invalid token symbols' },
        { status: 404 }
      );
    }

    // Prevent swapping same token
    if (fromToken.id === toToken.id) {
      return NextResponse.json(
        { error: `Cannot swap ${fromCoin} to itself.` },
        { status: 400 }
      );
    }

    // Get user balance for source token
    const { data: balanceData, error: balanceError } = await adminClient.rpc(
      'get_user_balance',
      {
        p_user_id: user.id,
        p_base_token_id: fromToken.id,
      }
    );

    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    const availableBalance = parseFloat(balanceData.available_balance || 0);

    // Check sufficient available balance
    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: 'Insufficient available balance',
          available: availableBalance,
          requested: amount,
          locked: parseFloat(balanceData.locked_balance || 0),
        },
        { status: 400 }
      );
    }

    // Execute swap using atomic database function (NEW: execute_swap_v2)
    // This ensures both balances are updated together or not at all
    const { data: swapResult, error: swapError } = await adminClient.rpc(
      'execute_swap_v2',
      {
        p_user_id: user.id,
        p_from_token_id: fromToken.id,
        p_to_token_id: toToken.id,
        p_from_amount: amount,
        p_to_amount: estimate.toAmount,
      }
    );

    if (swapError) {
      console.error('Error executing swap:', swapError);
      return NextResponse.json(
        { error: swapError.message || 'Failed to execute swap' },
        { status: 500 }
      );
    }

    // ──── RECORD TRANSACTION FOR KYC LIMITS ────
    // Update daily transaction total for limit tracking
    try {
      await recordTransaction(adminClient, user.id, estimatedValueUsd);
    } catch (recordError) {
      console.error('Error recording transaction for KYC:', recordError);
      // Don't fail the swap if recording fails, just log it
    }

    // Extract new balances from result
    const newFromBalance = swapResult.from_balance;
    const newToBalance = swapResult.to_balance;

    // Create transaction record with new schema
    const swapTransaction = formatSwapTransaction(estimate);

    const { data: transaction, error: txError } = await adminClient
      .from('transactions')
      .insert({
        user_id: user.id,
        base_token_id: fromToken.id,
        token_deployment_id: null, // Not needed for swaps
        type: 'swap',
        amount: amount.toString(),
        coin_symbol: fromCoin, // Keep for backward compatibility
        status: 'completed',
        ...swapTransaction, // Includes swap_from_coin and swap_to_coin strings
        // Foreign keys for efficient querying
        swap_from_token_id: fromToken.id,
        swap_to_token_id: toToken.id,
        notes: `Swapped ${amount} ${fromToken.symbol} to ${estimate.toAmount.toFixed(8)} ${toToken.symbol}`,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction record:', txError);
      // Note: Balances are already updated, but transaction record failed
      // This is logged for admin review
    }

    // TODO: Send email notification to user about swap completion
    // Template needed: SwapCompletionEmail
    // const { data: userProfile } = await adminClient
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendSwapCompletionEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //     fromCoin,
    //     toCoin,
    //     fromAmount: amount,
    //     toAmount: estimate.toAmount,
    //     rate: estimate.rate,
    //   });
    // }

    return NextResponse.json({
      success: true,
      transaction,
      estimate,
      newBalances: {
        [fromCoin]: newFromBalance,
        [toCoin]: newToBalance,
      },
    });
  } catch (error) {
    console.error('Swap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

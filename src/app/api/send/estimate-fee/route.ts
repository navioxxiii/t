/**
 * Fee Estimation API Endpoint
 * Get network fee estimate for sending crypto
 *
 * Uses static network fees from database for simplicity and reliability.
 * - User selects network/deployment at withdrawal time
 * - Checks available balance (balance - locked_balance)
 * - Returns network withdrawal fee from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { deploymentSymbol, toAddress, amount } = body;

    // Validate inputs
    if (!deploymentSymbol || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: deploymentSymbol, toAddress, amount' },
        { status: 400 }
      );
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get token deployment (includes base_token_id, network_id, and gateway info)
    const { data: deployment, error: deploymentError } = await supabase
      .from('token_deployments')
      .select(`
        id,
        symbol,
        display_name,
        gateway,
        gateway_config,
        base_token_id,
        network_id,
        base_tokens (
          id,
          code,
          symbol,
          name
        ),
        networks (
          id,
          code,
          name,
          withdrawal_fee,
          min_withdrawal,
          withdrawal_enabled
        )
      `)
      .eq('symbol', deploymentSymbol)
      .eq('is_active', true)
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json(
        { error: 'Invalid token deployment' },
        { status: 404 }
      );
    }

    const baseToken = deployment.base_tokens as any;
    const network = deployment.networks as any;

    // Check if withdrawals are enabled for this network
    if (!network.withdrawal_enabled) {
      return NextResponse.json(
        { error: `Withdrawals are currently disabled for ${network.name}` },
        { status: 400 }
      );
    }

    // Check minimum withdrawal
    if (network.min_withdrawal && parseFloat(amount) < parseFloat(network.min_withdrawal)) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${network.min_withdrawal} ${baseToken.symbol}` },
        { status: 400 }
      );
    }

    // Get user balance for this base token
    const { data: balanceData, error: balanceQueryError } = await supabase.rpc(
      'get_user_balance',
      {
        p_user_id: user.id,
        p_base_token_id: deployment.base_token_id,
      }
    );

    if (balanceQueryError) {
      console.error('Failed to get balance:', balanceQueryError);
      return NextResponse.json(
        { error: 'Failed to check balance' },
        { status: 500 }
      );
    }

    const availableBalance = parseFloat(balanceData.available_balance || 0);

    // Check sufficient available balance
    if (availableBalance < parseFloat(amount)) {
      return NextResponse.json(
        {
          error: 'Insufficient available balance',
          available: availableBalance,
          requested: parseFloat(amount),
          locked: parseFloat(balanceData.locked_balance || 0),
        },
        { status: 400 }
      );
    }

    // Use static network fee from database
    // This is simpler and more reliable than dynamic Plisio fee estimation
    const feeEstimate = {
      fee: network.withdrawal_fee || '0',
      feeCurrency: baseToken.symbol,
    };

    return NextResponse.json({
      success: true,
      deploymentSymbol,
      baseTokenSymbol: baseToken.symbol,
      networkCode: network.code,
      networkName: network.name,
      amount,
      availableBalance,
      feeEstimate,
      minWithdrawal: network.min_withdrawal,
      message: 'Fee estimate retrieved successfully',
    });
  } catch (error) {
    console.error('Fee estimation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to estimate fee',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

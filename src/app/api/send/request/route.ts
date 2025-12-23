/**
 * Send Request API Endpoint
 * User submits a send (withdrawal) request with network selection
 *
 * NEW: Uses centralized balance system
 * - User selects network at withdrawal time
 * - Locks balance (not deduct) until admin approval
 * - Supports internal transfers via deposit addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { deploymentSymbol, toAddress, amount, estimatedFee } = body;

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

    // Get token deployment (includes base_token_id and network_id)
    const { data: deployment, error: deploymentError } = await adminClient
      .from('token_deployments')
      .select(`
        id,
        symbol,
        display_name,
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
    const { data: balanceData, error: balanceQueryError } = await adminClient.rpc(
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

    // Check if address belongs to another user in the system (internal transfer)
    const { data: recipientAddress } = await adminClient
      .from('deposit_addresses')
      .select(`
        id,
        user_id,
        token_deployment_id,
        token_deployments (
          base_token_id
        )
      `)
      .eq('address', toAddress)
      .neq('user_id', user.id) // Exclude sender's own addresses
      .maybeSingle();

    const recipientDeployment = recipientAddress?.token_deployments as any;
    const isInternalTransfer =
      !!recipientAddress &&
      recipientDeployment?.base_token_id === deployment.base_token_id;
    const recipientUserId = recipientAddress?.user_id || null;

    // Get recipient email if internal transfer
    let recipientEmail = null;
    if (isInternalTransfer && recipientUserId) {
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', recipientUserId)
        .single();
      recipientEmail = recipientProfile?.email;
    }

    // console.log('Internal transfer check:', {
    //   toAddress,
    //   deployment: deploymentSymbol,
    //   isInternal: isInternalTransfer,
    //   recipientUserId,
    //   recipientEmail,
    //   recipientAddress,
    //   recipientDeployment,
    //   "baseTokenMatch": recipientDeployment?.base_token_id === deployment.base_token_id,
    // });

    // Create transaction record with new schema
    const { data: transaction, error: txError } = await adminClient
      .from('transactions')
      .insert({
        user_id: user.id,
        base_token_id: deployment.base_token_id,
        network_id: deployment.network_id,
        token_deployment_id: deployment.id,
        type: 'withdrawal',
        amount: amount,
        coin_symbol: deploymentSymbol, // Keep for backward compatibility
        status: 'pending',
        to_address: toAddress,
        network_fee: estimatedFee || network.withdrawal_fee || '0',
        // notes: `Send request pending admin approval via ${network.name}`,
      })
      .select()
      .single();

    if (txError) {
      console.error('Failed to create transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Create withdrawal request
    const { data: withdrawalRequest, error: wrError } = await adminClient
      .from('withdrawal_requests')
      .insert({
        transaction_id: transaction.id,
        user_id: user.id,
        amount: amount,
        coin_symbol: deploymentSymbol,
        to_address: toAddress,
        status: 'pending',
        processing_type: null, // Will be set when admin approves
        is_internal_transfer: isInternalTransfer,
        recipient_user_id: recipientUserId,
      })
      .select()
      .single();

    if (wrError) {
      console.error('Failed to create withdrawal request:', wrError);
      // Rollback transaction
      await adminClient.from('transactions').delete().eq('id', transaction.id);

      return NextResponse.json(
        { error: 'Failed to create send request' },
        { status: 500 }
      );
    }

    // Lock balance for pending withdrawal (NEW: lock instead of deduct)
    const { error: lockError } = await adminClient.rpc('lock_user_balance', {
      p_user_id: user.id,
      p_base_token_id: deployment.base_token_id,
      p_amount: parseFloat(amount),
    });

    if (lockError) {
      console.error('Failed to lock balance:', lockError);
      // Rollback transaction and withdrawal request
      await adminClient.from('transactions').delete().eq('id', transaction.id);
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', withdrawalRequest.id);

      return NextResponse.json(
        { error: 'Failed to lock funds for withdrawal' },
        { status: 500 }
      );
    }

    console.log('✅ Send request created:', {
      transaction_id: transaction.id,
      request_id: withdrawalRequest.id,
      user: user.id,
      base_token: baseToken.symbol,
      network: network.name,
      amount: amount,
      locked_balance: parseFloat(balanceData.locked_balance || 0) + parseFloat(amount),
    });

    // TODO: Send email notification to user
    // TODO: Send notification to admins

    return NextResponse.json({
      success: true,
      message: `Send request submitted successfully via ${network.name}`,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        token: baseToken.symbol,
        network: network.name,
        toAddress: transaction.to_address,
        networkFee: transaction.network_fee,
      },
      request: {
        id: withdrawalRequest.id,
        status: withdrawalRequest.status,
        isInternalTransfer,
      },
      balance: {
        available: availableBalance - parseFloat(amount),
        locked: parseFloat(balanceData.locked_balance || 0) + parseFloat(amount),
      },
    });
  } catch (error) {
    console.error('Send request error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process send request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate Deposit Addresses API Endpoint
 * Creates permanent cryptocurrency deposit addresses for users
 *
 * Supports multiple payment gateways:
 * - Plisio: Permanent addresses for BTC, ETH, LTC, etc.
 * - NOWPayments: Permanent addresses for SOL, XRP, ADA
 * - Internal: Shared default addresses for unsupported tokens
 *
 * Uses centralized balance system:
 * - Creates deposit_addresses (no balances stored here)
 * - Initializes zero balances in user_balances
 * - Creates preferences for all base tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGatewayByConfig } from '@/lib/gateways';
import type { GatewayType, GatewayConfig } from '@/lib/gateways';

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

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    // Extract optional base_token_id from query params
    const { searchParams } = new URL(request.url);
    const baseTokenIdParam = searchParams.get('base_token_id');
    const filterByBaseToken = baseTokenIdParam ? parseInt(baseTokenIdParam) : null;

    if (filterByBaseToken) {
      console.log(`Generating addresses only for base_token_id: ${filterByBaseToken}`);
    }

    // Fetch all active token deployments from database
    let deploymentsQuery = adminClient
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
          name
        )
      `)
      .eq('is_active', true);

    // Filter by base_token_id if provided
    if (filterByBaseToken) {
      deploymentsQuery = deploymentsQuery.eq('base_token_id', filterByBaseToken);
    }

    const { data: deployments, error: deploymentsError } = await deploymentsQuery
      .order('symbol', { ascending: true });

    if (deploymentsError || !deployments || deployments.length === 0) {
      console.error('Failed to fetch token deployments:', deploymentsError);
      return NextResponse.json(
        { error: 'No active token deployments available' },
        { status: 500 }
      );
    }

    // Fetch existing deposit addresses for this user
    const { data: existingAddresses } = await adminClient
      .from('deposit_addresses')
      .select('token_deployment_id')
      .eq('user_id', user.id);

    const existingDeploymentIds = new Set(
      existingAddresses?.map(addr => addr.token_deployment_id) || []
    );

    console.log(`User has existing addresses for ${existingDeploymentIds.size} deployments`);

    // Generate addresses for all active deployments
    const addresses = [];
    const errors = [];

    for (const deployment of deployments) {
      // Skip if address already exists for this deployment
      if (existingDeploymentIds.has(deployment.id)) {
        console.log(`Skipping ${deployment.symbol} - address already exists`);
        continue;
      }

      try {
        // Get the appropriate gateway adapter for this deployment
        const gatewayType = deployment.gateway as GatewayType;
        const gatewayConfig = deployment.gateway_config as GatewayConfig | null;

        console.log(
          `Generating ${deployment.symbol} address via ${gatewayType} gateway for user ${user.id}...`
        );

        // Create gateway adapter and generate address
        const gateway = getGatewayByConfig(gatewayType, gatewayConfig);

        if (!gateway.isConfigured() && gatewayType !== 'internal') {
          console.error(`Gateway ${gatewayType} is not configured for ${deployment.symbol}`);
          errors.push({
            deployment: deployment.symbol,
            error: `Gateway ${gatewayType} is not configured`,
          });
          continue;
        }

        // Generate deposit address via the gateway
        const depositResult = await gateway.createDepositAddress(user.id);

        const address = depositResult.address;
        const isShared = depositResult.isShared;
        const extraId = depositResult.extraId; // Destination tag for XRP, etc.

        console.log(
          `✓ ${deployment.symbol} address created via ${gatewayType}: ${address.slice(0, 12)}...${extraId ? ` (tag: ${extraId})` : ''}`
        );

        // Save deposit address to database (NO balance here!)
        const { data: depositAddress, error } = await adminClient
          .from('deposit_addresses')
          .insert({
            user_id: user.id,
            token_deployment_id: deployment.id,
            address: address,
            extra_id: extraId || null, // Destination tag/memo for XRP, XLM, etc.
            is_shared: isShared,
            is_permanent: depositResult.isPermanent,
          })
          .select()
          .single();

        if (error) {
          console.error(`Database error for ${deployment.symbol}:`, error);
          errors.push({
            deployment: deployment.symbol,
            error: 'Failed to save to database',
          });
        } else {
          // Type assertion for nested relations
          const baseToken = Array.isArray(deployment.base_tokens)
            ? deployment.base_tokens[0]
            : deployment.base_tokens;
          const network = Array.isArray(deployment.networks)
            ? deployment.networks[0]
            : deployment.networks;

          addresses.push({
            ...depositAddress,
            deployment_info: {
              symbol: deployment.symbol,
              display_name: deployment.display_name,
              base_token: baseToken?.symbol,
              network: network?.name,
            },
          });
        }
      } catch (error) {
        console.error(`Error generating ${deployment.symbol} address:`, error);
        errors.push({
          deployment: deployment.symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Initialize zero balances for all base tokens
    const { data: baseTokens } = await adminClient
      .from('base_tokens')
      .select('id')
      .eq('is_active', true);

    if (baseTokens && baseTokens.length > 0) {
      const balanceInserts = baseTokens.map((token) => ({
        user_id: user.id,
        base_token_id: token.id,
        balance: 0,
        locked_balance: 0,
      }));

      const { error: balanceError } = await adminClient
        .from('user_balances')
        .upsert(balanceInserts, {
          onConflict: 'user_id,base_token_id',
          ignoreDuplicates: true
        });

      if (balanceError) {
        console.error('Failed to initialize balances:', balanceError);
        // Non-fatal - balances will be created on first transaction
      } else {
        console.log(`✓ Initialized/verified ${baseTokens.length} zero balances`);
      }
    }

    // Ensure user has token preferences (should be created by handle_new_user, but double-check)
    const { data: existingPrefs } = await adminClient
      .from('user_token_preferences')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingPrefs || existingPrefs.length === 0) {
      if (baseTokens && baseTokens.length > 0) {
        const prefInserts = baseTokens.map((token) => ({
          user_id: user.id,
          base_token_id: token.id,
          is_visible: true,
        }));

        await adminClient.from('user_token_preferences').insert(prefInserts);
        console.log(`✓ Created ${baseTokens.length} token preferences`);
      }
    }

    // Return results
    if (addresses.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to generate any deposit addresses',
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: addresses.length > 0
        ? `Generated ${addresses.length} new deposit addresses`
        : 'All deposit addresses already exist',
      addresses,
      skipped: existingDeploymentIds.size,
      balances_initialized: baseTokens?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Deposit address generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate deposit addresses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

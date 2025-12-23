/**
 * Balances API Endpoint
 * Fetch user balances (centralized system)
 *
 * NEW: Returns unified balance per base token (e.g., one USDT total)
 * with multiple deposit addresses per network
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const baseTokenCode = searchParams.get('token'); // Filter by base token code (e.g., 'usdt')
    // const includeZero = searchParams.get('include_zero') === 'true'; // Include zero balances
    const includeZero = true; // Include zero balances

    // Fetch user balances with base token info
    let balanceQuery = supabase
      .from('user_balances')
      .select(`
        balance,
        locked_balance,
        updated_at,
        base_tokens (
          id,
          code,
          name,
          symbol,
          token_type,
          is_stablecoin,
          decimals,
          icon,
          logo_url
        )
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (!includeZero) {
      balanceQuery = balanceQuery.gt('balance', 0);
    }

    if (baseTokenCode) {
      // Filter by base token code (requires join through base_tokens)
      balanceQuery = balanceQuery.eq('base_tokens.code', baseTokenCode);
    }

    const { data: balances, error: balancesError } = await balanceQuery;

    if (balancesError) {
      console.error('Failed to fetch balances:', balancesError);
      return NextResponse.json(
        { error: 'Failed to fetch balances' },
        { status: 500 }
      );
    }

    if (!balances || balances.length === 0) {
      return NextResponse.json({
        balances: [],
        message: includeZero ? 'No balances found' : 'No non-zero balances found',
      });
    }

    // Enrich each balance with deposit addresses (grouped by network)
    const enrichedBalances = await Promise.all(
      balances.map(async (bal) => {
        // Supabase returns nested joins as objects, not arrays
        const baseToken = bal.base_tokens as any;

        if (!baseToken) {
          console.error('Missing base_tokens for balance:', bal);
          return null;
        }

        // Fetch all deposit addresses for this base token
        const { data: addresses, error: addressesError } = await supabase
          .from('deposit_addresses')
          .select(`
            id,
            address,
            is_shared,
            is_permanent,
            created_at,
            token_deployments!inner (
              id,
              symbol,
              display_name,
              token_standard,
              contract_address,
              decimals,
              base_token_id,
              networks (
                id,
                code,
                name,
                display_name,
                network_type,
                withdrawal_fee,
                withdrawal_fee_percent,
                min_withdrawal,
                withdrawal_enabled,
                deposit_enabled,
                logo_url,
                explorer_url
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('token_deployments.base_token_id', baseToken.id);

        if (addressesError) {
          console.error('Failed to fetch addresses:', addressesError);
        }

        // Calculate available balance
        const totalBalance = parseFloat(bal.balance as any);
        const lockedBalance = parseFloat(bal.locked_balance as any);
        const availableBalance = totalBalance - lockedBalance;

        return {
          // Base token info
          token: {
            id: baseToken.id,
            code: baseToken.code,
            name: baseToken.name,
            symbol: baseToken.symbol,
            token_type: baseToken.token_type,
            is_stablecoin: baseToken.is_stablecoin,
            decimals: baseToken.decimals,
            icon: baseToken.icon,
            logo_url: baseToken.logo_url,
          },

          // Balance info
          balance: totalBalance,
          locked_balance: lockedBalance,
          available_balance: availableBalance,
          updated_at: bal.updated_at,

          // Deposit addresses (multiple networks)
          deposit_addresses: (addresses || []).map((addr) => {
            // Supabase returns nested joins as objects, not arrays
            const deployment = addr.token_deployments as any;
            const network = deployment?.networks as any;

            return {
              id: addr.id,
              address: addr.address,
              is_shared: addr.is_shared,
              is_permanent: addr.is_permanent,
              created_at: addr.created_at,

              // Deployment info
              deployment: {
                id: deployment?.id,
                symbol: deployment?.symbol,
                display_name: deployment?.display_name,
                token_standard: deployment?.token_standard,
                contract_address: deployment?.contract_address,
                decimals: deployment?.decimals,
              },

              // Network info
              network: {
                id: network?.id,
                code: network?.code,
                name: network?.name,
                display_name: network?.display_name,
                network_type: network?.network_type,
                withdrawal_fee: network?.withdrawal_fee,
                withdrawal_fee_percent: network?.withdrawal_fee_percent,
                min_withdrawal: network?.min_withdrawal,
                withdrawal_enabled: network?.withdrawal_enabled,
                deposit_enabled: network?.deposit_enabled,
                logo_url: network?.logo_url,
                explorer_url: network?.explorer_url,
              },
            };
          }),
        };
      })
    );

    // Filter out nulls
    const validBalances = enrichedBalances.filter((b) => b !== null);

    return NextResponse.json({
      balances: validBalances,
      count: validBalances.length,
      total_networks: validBalances.reduce(
        (sum, b) => sum + (b?.deposit_addresses?.length || 0),
        0
      ),
    });
  } catch (error) {
    console.error('Balances API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

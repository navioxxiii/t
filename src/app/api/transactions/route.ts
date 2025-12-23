/**
 * Transactions API Endpoint
 * Fetch user transaction history
 * Next.js 15 compatible
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
    const coinSymbol = searchParams.get('coin'); // Legacy: symbol-based filtering
    const baseTokenId = searchParams.get('base_token_id'); // NEW: ID-based filtering (preferred)
    const type = searchParams.get('type'); // 'deposit' or 'withdrawal'
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed', 'cancelled'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ========================================
    // BUILD QUERY WITH JOINS (Single Query for All Tokens)
    // ========================================

    // Build query with joins for ALL tokens (base + swap_from + swap_to)
    let query = supabase
      .from('transactions')
      .select(`
        *,
        base_tokens!transactions_base_token_id_fkey (
          id, code, symbol, name, logo_url, decimals, icon
        ),
        networks!transactions_network_id_fkey (
          id, code, name, display_name, logo_url
        ),
        token_deployments!transactions_token_deployment_id_fkey (
          id, symbol, display_name, contract_address
        ),
        swap_from_base_tokens:base_tokens!transactions_swap_from_token_id_fkey (
          id, code, symbol, name, logo_url, decimals, icon
        ),
        swap_to_base_tokens:base_tokens!transactions_swap_to_token_id_fkey (
          id, code, symbol, name, logo_url, decimals, icon
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    // Prefer base_token_id (direct FK filtering, no lookup needed)
    if (baseTokenId) {
      const tokenId = parseInt(baseTokenId);
      // Direct FK-based filtering (fast, no lookup queries!)
      query = query.or(
        `base_token_id.eq.${tokenId},swap_from_token_id.eq.${tokenId},swap_to_token_id.eq.${tokenId}`
      );
    } else if (coinSymbol) {
      // Legacy: Symbol-based filtering (requires lookup, slower)
      // Try base_tokens first (for base symbols like "USDT", "BTC")
      const { data: baseTokenData } = await supabase
        .from('base_tokens')
        .select('id')
        .eq('symbol', coinSymbol)
        .eq('is_active', true)
        .single();

      let baseToken = baseTokenData;

      // If not found in base_tokens, try token_deployments (for deployment symbols like "USDT_TRX")
      if (!baseToken) {
        const { data: deployment } = await supabase
          .from('token_deployments')
          .select('base_token_id')
          .eq('symbol', coinSymbol)
          .eq('is_active', true)
          .single();

        if (deployment?.base_token_id) {
          baseToken = { id: deployment.base_token_id };
        }
      }

      if (baseToken) {
        query = query.or(
          `base_token_id.eq.${baseToken.id},swap_from_token_id.eq.${baseToken.id},swap_to_token_id.eq.${baseToken.id}`
        );
      } else {
        // Final fallback to string matching for legacy data
        query = query.or(`coin_symbol.eq.${coinSymbol},swap_from_coin.eq.${coinSymbol},swap_to_coin.eq.${coinSymbol}`);
      }
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // ========================================
    // RENAME JOINED FIELDS FOR FRONTEND COMPATIBILITY
    // ========================================

    // Transform joined fields to match frontend expectations
    const enrichedTransactions = transactions.map((tx: any) => ({
      ...tx,
      // Rename joined fields
      token: tx.base_tokens || null,
      network: tx.networks || null,
      deployment: tx.token_deployments || null,
      swap_from_token: tx.swap_from_base_tokens || null,
      swap_to_token: tx.swap_to_base_tokens || null,
      // Clean up original join artifacts
      base_tokens: undefined,
      networks: undefined,
      token_deployments: undefined,
      swap_from_base_tokens: undefined,
      swap_to_base_tokens: undefined,
    }));

    // Get total count for pagination
    let countQuery = supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Apply same filters to count query
    if (baseTokenId) {
      const tokenId = parseInt(baseTokenId);
      countQuery = countQuery.or(
        `base_token_id.eq.${tokenId},swap_from_token_id.eq.${tokenId},swap_to_token_id.eq.${tokenId}`
      );
    } else if (coinSymbol) {
      // Legacy symbol-based filtering
      // NOTE: This path requires the symbol lookup above to have run
      // For new code, prefer passing base_token_id directly
      countQuery = countQuery.or(`coin_symbol.eq.${coinSymbol},swap_from_coin.eq.${coinSymbol},swap_to_coin.eq.${coinSymbol}`);
    }
    if (type) countQuery = countQuery.eq('type', type);
    if (status) countQuery = countQuery.eq('status', status);

    const { count } = await countQuery;

    return NextResponse.json({
      transactions: enrichedTransactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

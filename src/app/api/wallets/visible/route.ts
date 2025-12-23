import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch only visible user balances with token info
 * Filter: token is_active=true AND user preference is_visible=true
 * Query param: ?coin=BTC (optional - filters by token symbol)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const coinFilter = searchParams.get('coin');

    // Build query to get user balances with base token info
    let query = supabase
      .from('user_balances')
      .select(`
        id,
        user_id,
        balance,
        locked_balance,
        created_at,
        updated_at,
        base_tokens:base_token_id (
          id,
          code,
          name,
          symbol,
          token_type,
          is_stablecoin,
          decimals,
          icon,
          logo_url,
          is_active,
          price_provider,
          price_provider_id
        )
      `)
      .eq('user_id', user.id);

    // Apply coin filter if provided
    if (coinFilter) {
      // We need to filter by the joined base_tokens.symbol
      // This requires a different approach - filter after fetch
    }

    const { data: balances, error } = await query;

    if (error) {
      console.error('[Visible Wallets] Error fetching balances:', error);
      return NextResponse.json(
        { error: 'Failed to fetch balances' },
        { status: 500 }
      );
    }

    if (!balances) {
      return NextResponse.json({ wallets: [] }, { status: 200 });
    }

    // Fetch user token preferences
    const { data: preferences } = await supabase
      .from('user_token_preferences')
      .select('base_token_id, is_visible')
      .eq('user_id', user.id);

    // Create a map of base_token_id -> is_visible
    const visibilityMap = new Map(
      preferences?.map((p) => [p.base_token_id, p.is_visible]) || []
    );

    // Filter balances:
    // 1. Token must be active (is_active=true)
    // 2. Token must be visible according to user preferences (default: true)
    // 3. If coinFilter provided, filter by symbol
    const visibleBalances = balances.filter((balance) => {
      const token = Array.isArray(balance.base_tokens)
        ? balance.base_tokens[0]
        : balance.base_tokens;
      if (!token) return false;

      // Check if token is active
      if (!token.is_active) return false;

      // Check if token is visible according to user preferences (default is visible)
      const isVisible = visibilityMap.get(token.id);
      if (isVisible === false) return false;

      // Apply coin filter if provided
      if (coinFilter && token.symbol !== coinFilter) return false;

      return true;
    });

    // Transform to wallet-like format for backward compatibility
    const wallets = visibleBalances.map((balance) => {
      const token = Array.isArray(balance.base_tokens)
        ? balance.base_tokens[0]
        : balance.base_tokens;

      return {
        id: balance.id,
        user_id: balance.user_id,
        coin_symbol: token?.symbol || '',
        coin_name: token?.name || '',
        balance: balance.balance,
        locked_balance: balance.locked_balance,
        created_at: balance.created_at,
        updated_at: balance.updated_at,
        // Include token details for backward compatibility
        coins: token ? {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          logo_url: token.logo_url,
          is_active: token.is_active,
          decimals: token.decimals,
          icon: token.icon,
          price_provider: token.price_provider,
          price_provider_id: token.price_provider_id,
        } : null,
      };
    });

    return NextResponse.json({ wallets }, { status: 200 });
  } catch (error) {
    console.error('[Visible Wallets] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

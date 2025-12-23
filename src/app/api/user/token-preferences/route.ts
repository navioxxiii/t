/**
 * User Token Preferences API Endpoint
 * Manage user's token visibility preferences (new centralized system)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET - Fetch user's token preferences with base_tokens details
 * Returns all active base tokens with user's visibility preference
 * Defaults to is_visible: true if no preference exists
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch all active base tokens
    const { data: baseTokens, error: tokensError } = await adminClient
      .from('base_tokens')
      .select('id, code, symbol, name, logo_url, token_type, is_stablecoin, decimals')
      .eq('is_active', true)
      .order('symbol', { ascending: true });

    if (tokensError) {
      console.error('[Token Preferences] Error fetching base tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch base tokens' },
        { status: 500 }
      );
    }

    // Fetch user's existing preferences
    const { data: userPrefs, error: prefsError } = await adminClient
      .from('user_token_preferences')
      .select('base_token_id, is_visible, sort_order')
      .eq('user_id', user.id);

    if (prefsError) {
      console.error('[Token Preferences] Error fetching preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Create a map of user preferences
    const prefsMap = new Map(
      (userPrefs || []).map(pref => [pref.base_token_id, pref])
    );

    // Merge base tokens with user preferences (default to visible if no preference)
    const preferences = (baseTokens || []).map(token => ({
      id: prefsMap.get(token.id)?.base_token_id || null,
      user_id: user.id,
      base_token_id: token.id,
      is_visible: prefsMap.get(token.id)?.is_visible ?? true,
      sort_order: prefsMap.get(token.id)?.sort_order || 0,
      base_tokens: {
        id: token.id,
        code: token.code,
        symbol: token.symbol,
        name: token.name,
        logo_url: token.logo_url,
        token_type: token.token_type,
        is_stablecoin: token.is_stablecoin,
        decimals: token.decimals,
      },
    }));

    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    console.error('[Token Preferences] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Toggle single token visibility
 * Body: { base_token_id: number, is_visible: boolean }
 * Uses UPSERT (insert if not exists, update if exists)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const { base_token_id, is_visible } = body;

    // Validate input
    if (base_token_id === undefined || is_visible === undefined) {
      return NextResponse.json(
        { error: 'base_token_id and is_visible are required' },
        { status: 400 }
      );
    }

    if (typeof is_visible !== 'boolean') {
      return NextResponse.json(
        { error: 'is_visible must be a boolean' },
        { status: 400 }
      );
    }

    // Verify base_token exists
    const { data: tokenExists, error: tokenError } = await adminClient
      .from('base_tokens')
      .select('id')
      .eq('id', base_token_id)
      .single();

    if (tokenError || !tokenExists) {
      return NextResponse.json(
        { error: 'Invalid base_token_id' },
        { status: 400 }
      );
    }

    // Upsert preference (insert if not exists, update if exists)
    const { error } = await adminClient
      .from('user_token_preferences')
      .upsert(
        {
          user_id: user.id,
          base_token_id,
          is_visible,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,base_token_id',
        }
      );

    if (error) {
      console.error('[Token Preferences] Error upserting preference:', error);
      return NextResponse.json(
        { error: 'Failed to update preference' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Preference updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Token Preferences] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

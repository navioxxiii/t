/**
 * Base Tokens API Endpoint
 * Fetch all active base tokens
 *
 * This endpoint returns all tokens enabled in the system (public data).
 * Used for token preference selection UI.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all active base tokens
    const { data: tokens, error } = await supabase
      .from('base_tokens')
      .select(`
        id,
        code,
        symbol,
        name,
        token_type,
        is_stablecoin,
        decimals,
        icon,
        logo_url,
        is_active
      `)
      .eq('is_active', true)
      .order('symbol', { ascending: true });

    if (error) {
      console.error('Failed to fetch base tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch base tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tokens: tokens || [],
      count: tokens?.length || 0,
    });
  } catch (error) {
    console.error('Base tokens API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

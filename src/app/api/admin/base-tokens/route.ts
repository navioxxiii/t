/**
 * Base Tokens API Endpoint
 * GET - List all base tokens
 * POST - Create new base token
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (super_admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const tokenType = searchParams.get('token_type');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    // Build query
    let query = supabase.from('base_tokens').select('*');

    // Apply filters
    if (tokenType) {
      query = query.eq('token_type', tokenType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`symbol.ilike.%${search}%,name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: tokens, error } = await query;

    if (error) {
      console.error('Error fetching base tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch base tokens' }, { status: 500 });
    }

    return NextResponse.json({ data: tokens, total: tokens.length}, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (super_admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();

    // Validation
    if (!body.code || !body.symbol || !body.name) {
      return NextResponse.json(
        { error: 'Code, symbol, and name are required' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('base_tokens')
      .select('id')
      .eq('code', body.code)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Token code already exists' }, { status: 409 });
    }

    // Create record
    const { data: token, error } = await supabase
      .from('base_tokens')
      .insert({
        code: body.code,
        symbol: body.symbol,
        name: body.name,
        token_type: body.token_type || 'native',
        decimals: body.decimals || 18,
        is_stablecoin: body.is_stablecoin || false,
        binance_id: body.binance_id || null,
        coingecko_id: body.coingecko_id || null,
        primary_provider: body.primary_provider || 'binance_us',
        logo_url: body.logo_url || null,
        icon: body.icon || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating base token:', error);
      return NextResponse.json({ error: 'Failed to create base token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, token }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

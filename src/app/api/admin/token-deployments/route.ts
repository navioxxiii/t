/**
 * Token Deployments API Endpoint
 * GET - List all token deployments with base token and network details
 * POST - Create new token deployment
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
    const baseTokenId = searchParams.get('base_token_id');
    const networkId = searchParams.get('network_id');
    const tokenStandard = searchParams.get('token_standard');
    const isPlisio = searchParams.get('is_plisio');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    console.log({
      "baseTokenId": baseTokenId,
      "networkId": networkId,
      "tokenStandard": tokenStandard,
      "isPlisio": isPlisio,
      "isActive": isActive,
      "search": search,
    });
    // Build query with relationships
    let query = supabase
      .from('token_deployments')
      .select(`
        *,
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
          display_name
        )
      `);

    // Apply filters
    if (baseTokenId) {
      query = query.eq('base_token_id', baseTokenId);
    }

    if (networkId) {
      query = query.eq('network_id', networkId);
    }

    if (tokenStandard) {
      query = query.eq('token_standard', tokenStandard);
    }

    if (isPlisio !== null) {
      query = query.eq('is_plisio', isPlisio === 'true');
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`symbol.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: deployments, error } = await query;

    if (error) {
      console.error('Error fetching token deployments:', error);
      return NextResponse.json({ error: 'Failed to fetch token deployments' }, { status: 500 });
    }

    return NextResponse.json({ deployments }, { status: 200 });
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

    console.log('POST /api/admin/token-deployments - Request body:', body);

    // Validation
    if (!body.base_token_id || !body.network_id || !body.token_standard) {
      return NextResponse.json(
        { error: 'Base token, network, and token standard are required' },
        { status: 400 }
      );
    }

    // Check for duplicate (base_token_id, network_id) pair
    const { data: existing } = await supabase
      .from('token_deployments')
      .select('id')
      .eq('base_token_id', body.base_token_id)
      .eq('network_id', body.network_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This token is already deployed on this network' },
        { status: 409 }
      );
    }

    // Get base token and network info for generating symbol/display_name
    const { data: baseToken } = await supabase
      .from('base_tokens')
      .select('symbol, name')
      .eq('id', body.base_token_id)
      .single();

    const { data: network } = await supabase
      .from('networks')
      .select('name, code')
      .eq('id', body.network_id)
      .single();

    if (!baseToken || !network) {
      return NextResponse.json(
        { error: 'Invalid base token or network ID' },
        { status: 400 }
      );
    }

    // Auto-generate symbol and display_name if not provided
    const symbol = body.symbol || baseToken.symbol;
    const displayName = body.display_name || `${baseToken.name} (${network.code.toUpperCase()})`;

    // Create record
    const { data: deployment, error } = await supabase
      .from('token_deployments')
      .insert({
        base_token_id: body.base_token_id,
        network_id: body.network_id,
        symbol: symbol,
        display_name: displayName,
        token_standard: body.token_standard,
        contract_address: body.contract_address || null,
        decimals: body.decimals || 18,
        is_plisio: body.is_plisio || false,
        plisio_cid: body.plisio_cid || null,
        default_address: body.default_address || null,
        price_provider: body.price_provider || null,
        price_provider_id: body.price_provider_id || null,
        is_active: body.is_active ?? true,
      })
      .select(`
        *,
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
          display_name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating token deployment:', error);
      return NextResponse.json({ error: 'Failed to create token deployment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deployment }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

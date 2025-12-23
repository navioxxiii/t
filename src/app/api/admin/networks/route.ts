/**
 * Networks API Endpoint
 * GET - List all networks
 * POST - Create new network
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
    const networkType = searchParams.get('network_type');
    const withdrawalEnabled = searchParams.get('withdrawal_enabled');
    const depositEnabled = searchParams.get('deposit_enabled');
    const search = searchParams.get('search');

    // Build query
    let query = supabase.from('networks').select('*');

    // Apply filters
    if (networkType) {
      query = query.eq('network_type', networkType);
    }

    if (withdrawalEnabled !== null) {
      query = query.eq('withdrawal_enabled', withdrawalEnabled === 'true');
    }

    if (depositEnabled !== null) {
      query = query.eq('deposit_enabled', depositEnabled === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: networks, error } = await query;

    if (error) {
      console.error('Error fetching networks:', error);
      return NextResponse.json({ error: 'Failed to fetch networks' }, { status: 500 });
    }

    return NextResponse.json({ networks }, { status: 200 });
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
    if (!body.code || !body.name || !body.network_type) {
      return NextResponse.json(
        { error: 'Code, name, and network_type are required' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('networks')
      .select('id')
      .eq('code', body.code)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Network code already exists' }, { status: 409 });
    }

    // Create record
    const { data: network, error } = await supabase
      .from('networks')
      .insert({
        code: body.code,
        name: body.name,
        display_name: body.display_name || body.name,
        network_type: body.network_type,
        chain_id: body.chain_id || null,
        withdrawal_fee: body.withdrawal_fee || 0,
        withdrawal_fee_percent: body.withdrawal_fee_percent || 0,
        min_withdrawal: body.min_withdrawal || 0,
        max_withdrawal: body.max_withdrawal || null,
        withdrawal_enabled: body.withdrawal_enabled ?? true,
        deposit_enabled: body.deposit_enabled ?? true,
        logo_url: body.logo_url || null,
        explorer_url: body.explorer_url || null,
        is_testnet: body.is_testnet || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating network:', error);
      return NextResponse.json({ error: 'Failed to create network' }, { status: 500 });
    }

    return NextResponse.json({ success: true, network }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

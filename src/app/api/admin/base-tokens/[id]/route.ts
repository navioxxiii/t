/**
 * Base Tokens API Endpoint - Single Token Operations
 * GET - Get single base token
 * PUT - Update base token
 * DELETE - Delete base token
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: token, error } = await supabase
      .from('base_tokens')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validation
    if (!body.symbol || !body.name) {
      return NextResponse.json({ error: 'Symbol and name are required' }, { status: 400 });
    }

    // Update record (code is immutable, so we don't allow it to be changed)
    const { data: token, error } = await supabase
      .from('base_tokens')
      .update({
        symbol: body.symbol,
        name: body.name,
        token_type: body.token_type,
        decimals: body.decimals,
        is_stablecoin: body.is_stablecoin,
        binance_id: body.binance_id !== undefined ? body.binance_id : undefined,
        coingecko_id: body.coingecko_id !== undefined ? body.coingecko_id : undefined,
        primary_provider: body.primary_provider !== undefined ? body.primary_provider : undefined,
        logo_url: body.logo_url || null,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating base token:', error);
      return NextResponse.json({ error: 'Failed to update base token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, token }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if there are any token_deployments using this base token
    const { data: deployments } = await supabase
      .from('token_deployments')
      .select('id')
      .eq('base_token_id', id)
      .limit(1);

    if (deployments && deployments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete base token with existing deployments. Please delete or reassign deployments first.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('base_tokens').delete().eq('id', id);

    if (error) {
      console.error('Error deleting base token:', error);
      return NextResponse.json({ error: 'Failed to delete base token' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

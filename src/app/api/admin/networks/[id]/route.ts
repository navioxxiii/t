/**
 * Networks API Endpoint - Single Network Operations
 * GET - Get single network
 * PUT - Update network
 * DELETE - Delete network
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

    const { data: network, error } = await supabase
      .from('networks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !network) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    return NextResponse.json({ network }, { status: 200 });
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
    if (!body.name || !body.network_type) {
      return NextResponse.json({ error: 'Name and network_type are required' }, { status: 400 });
    }

    // Update record (code is immutable, so we don't allow it to be changed)
    const { data: network, error } = await supabase
      .from('networks')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating network:', error);
      return NextResponse.json({ error: 'Failed to update network' }, { status: 500 });
    }

    return NextResponse.json({ success: true, network }, { status: 200 });
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

    // Check if there are any token_deployments using this network
    const { data: deployments } = await supabase
      .from('token_deployments')
      .select('id')
      .eq('network_id', id)
      .limit(1);

    if (deployments && deployments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete network with existing deployments. Please delete or reassign deployments first.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('networks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting network:', error);
      return NextResponse.json({ error: 'Failed to delete network' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Token Deployments API Endpoint - Single Deployment Operations
 * GET - Get single token deployment
 * PUT - Update token deployment
 * DELETE - Delete token deployment
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

    const { data: deployment, error } = await supabase
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
      `)
      .eq('id', id)
      .single();

    if (error || !deployment) {
      return NextResponse.json({ error: 'Token deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ deployment }, { status: 200 });
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
    if (!body.token_standard) {
      return NextResponse.json({ error: 'Token standard is required' }, { status: 400 });
    }

    // Get current deployment to check if base_token_id or network_id changed
    const { data: currentDeployment } = await supabase
      .from('token_deployments')
      .select('base_token_id, network_id')
      .eq('id', id)
      .single();

    if (!currentDeployment) {
      return NextResponse.json({ error: 'Token deployment not found' }, { status: 404 });
    }

    // If base_token_id or network_id changed, check for duplicate
    const baseTokenId = body.base_token_id || currentDeployment.base_token_id;
    const networkId = body.network_id || currentDeployment.network_id;

    if (
      baseTokenId !== currentDeployment.base_token_id ||
      networkId !== currentDeployment.network_id
    ) {
      const { data: existing } = await supabase
        .from('token_deployments')
        .select('id')
        .eq('base_token_id', baseTokenId)
        .eq('network_id', networkId)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This token is already deployed on this network' },
          { status: 409 }
        );
      }
    }

    // Update record
    const { data: deployment, error } = await supabase
      .from('token_deployments')
      .update({
        base_token_id: baseTokenId,
        network_id: networkId,
        symbol: body.symbol,
        display_name: body.display_name,
        token_standard: body.token_standard,
        contract_address: body.contract_address || null,
        decimals: body.decimals || 18,
        is_plisio: body.is_plisio || false,
        plisio_cid: body.plisio_cid || null,
        default_address: body.default_address || null,
        price_provider: body.price_provider || null,
        price_provider_id: body.price_provider_id || null,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      console.error('Error updating token deployment:', error);
      return NextResponse.json({ error: 'Failed to update token deployment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deployment }, { status: 200 });
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

    // Check if there are any deposit_addresses using this deployment
    const { data: addresses } = await supabase
      .from('deposit_addresses')
      .select('id')
      .eq('deployment_id', id)
      .limit(1);

    if (addresses && addresses.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete token deployment with existing deposit addresses. Users may have funds here.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('token_deployments').delete().eq('id', id);

    if (error) {
      console.error('Error deleting token deployment:', error);
      return NextResponse.json({ error: 'Failed to delete token deployment' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

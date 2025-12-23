/**
 * KYC Transaction Limits API Endpoint - Single Limit Operations
 * GET - Get single KYC limit
 * PUT - Update KYC limit
 * DELETE - Delete KYC limit
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

    const { data: limit, error } = await supabase
      .from('kyc_transaction_limits')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !limit) {
      return NextResponse.json({ error: 'KYC limit not found' }, { status: 404 });
    }

    return NextResponse.json({ limit }, { status: 200 });
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

    // Update record (tier is immutable)
    const { data: limit, error } = await supabase
      .from('kyc_transaction_limits')
      .update({
        daily_limit_usd: body.daily_limit_usd || 0,
        monthly_limit_usd: body.monthly_limit_usd || 0,
        single_transaction_limit_usd: body.single_transaction_limit_usd || 0,
        can_deposit: body.can_deposit ?? true,
        can_withdraw: body.can_withdraw ?? true,
        can_swap: body.can_swap ?? true,
        can_send: body.can_send ?? true,
        can_earn: body.can_earn ?? true,
        can_copy_trade: body.can_copy_trade ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating KYC limit:', error);
      return NextResponse.json({ error: 'Failed to update KYC limit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, limit }, { status: 200 });
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

    // Check if there are any users with this tier
    const { data: limit } = await supabase
      .from('kyc_transaction_limits')
      .select('tier')
      .eq('id', id)
      .single();

    if (limit) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('kyc_tier', limit.tier)
        .limit(1);

      if (users && users.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete tier with existing users. Please reassign users first.',
          },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase.from('kyc_transaction_limits').delete().eq('id', id);

    if (error) {
      console.error('Error deleting KYC limit:', error);
      return NextResponse.json({ error: 'Failed to delete KYC limit' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * KYC Transaction Limits API Endpoint
 * GET - List all KYC transaction limits
 * POST - Create new KYC limit tier
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Fetch all KYC limits ordered by tier hierarchy
    const { data: limits, error } = await supabase
      .from('kyc_transaction_limits')
      .select('*')
      .order('tier', { ascending: true });

    if (error) {
      console.error('Error fetching KYC limits:', error);
      return NextResponse.json({ error: 'Failed to fetch KYC limits' }, { status: 500 });
    }

    return NextResponse.json({ limits }, { status: 200 });
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
    if (!body.tier) {
      return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
    }

    // Check for duplicate tier
    const { data: existing } = await supabase
      .from('kyc_transaction_limits')
      .select('id')
      .eq('tier', body.tier)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Limits for this tier already exist' },
        { status: 409 }
      );
    }

    // Create record
    const { data: limit, error } = await supabase
      .from('kyc_transaction_limits')
      .insert({
        tier: body.tier,
        daily_limit_usd: body.daily_limit_usd || 0,
        monthly_limit_usd: body.monthly_limit_usd || 0,
        single_transaction_limit_usd: body.single_transaction_limit_usd || 0,
        can_deposit: body.can_deposit ?? true,
        can_withdraw: body.can_withdraw ?? true,
        can_swap: body.can_swap ?? true,
        can_send: body.can_send ?? true,
        can_earn: body.can_earn ?? true,
        can_copy_trade: body.can_copy_trade ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating KYC limit:', error);
      return NextResponse.json({ error: 'Failed to create KYC limit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, limit }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

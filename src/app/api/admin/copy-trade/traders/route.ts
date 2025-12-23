/**
 * Admin Traders API Endpoint
 * POST - Create new trader
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    if (!body.name || !body.strategy || !body.risk_level) {
      return NextResponse.json(
        { error: 'Name, strategy, and risk level are required' },
        { status: 400 }
      );
    }

    // Create trader
    const { data: trader, error } = await supabase
      .from('traders')
      .insert({
        name: body.name,
        avatar_url: body.avatar_url || null,
        strategy: body.strategy,
        risk_level: body.risk_level,
        aum_usdt: body.aum_usdt || 0,
        current_copiers: 0, // Always start at 0
        max_copiers: body.max_copiers || 100,
        performance_fee_percent: body.performance_fee_percent || 15,
        lifetime_earnings_usdt: 0, // Always start at 0
        historical_roi_min: body.historical_roi_min || 0,
        historical_roi_max: body.historical_roi_max || 0,
        stats: body.stats || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating trader:', error);
      return NextResponse.json({ error: 'Failed to create trader' }, { status: 500 });
    }

    return NextResponse.json({ success: true, trader }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

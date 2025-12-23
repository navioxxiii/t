/**
 * Admin Earn Vaults API
 * GET - List all vaults (including hidden ones)
 * POST - Create new vault (super_admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const globalFilter = searchParams.get('globalFilter') || '';
    const statusFilter = searchParams.get('status') || '';
    const riskFilter = searchParams.get('risk') || '';
    const durationFilter = searchParams.get('duration') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - NO status filter (admins see all vaults)
    let query = supabase
      .from('earn_vaults')
      .select('*, user_earn_positions(count)', { count: 'exact' });

    // Apply filters
    if (globalFilter) {
      query = query.or(`title.ilike.%${globalFilter}%,subtitle.ilike.%${globalFilter}%`);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (riskFilter && riskFilter !== 'all') {
      query = query.eq('risk_level', riskFilter);
    }

    if (durationFilter && durationFilter !== 'all') {
      query = query.eq('duration_months', parseInt(durationFilter));
    }

    // Get total count before pagination
    const { count: totalCount } = await query;

    // Apply sorting and pagination
    type ValidSortColumn = 'created_at' | 'apy' | 'tvl' | 'duration_months' | 'min_deposit';
    query = query
      .order(sortBy as ValidSortColumn, { ascending: sortOrder === 'asc' })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    const { data: vaults, error } = await query;

    if (error) {
      console.error('Failed to fetch vaults:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vaults' },
        { status: 500 }
      );
    }

    // Enrich vaults with position stats
    const vaultsWithStats = await Promise.all(
      (vaults || []).map(async (vault) => {
        // Get position counts and total locked
        const { data: positions } = await supabase
          .from('user_earn_positions')
          .select('status, amount_usdt')
          .eq('vault_id', vault.id);

        const activePositions = positions?.filter((p) => p.status === 'active') || [];
        const totalLocked = activePositions.reduce((sum, p) => sum + Number(p.amount_usdt), 0);

        return {
          ...vault,
          active_positions_count: activePositions.length,
          total_locked_usdt: totalLocked,
        };
      })
    );

    return NextResponse.json({
      data: vaultsWithStats,
      total: totalCount || 0,
      pageCount: Math.ceil((totalCount || 0) / pageSize),
    });

  } catch (error) {
    console.error('Admin earn vaults API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check super_admin role (only super admins can create vaults)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can create vaults' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      subtitle,
      apy_percent,
      duration_months,
      min_amount,
      max_amount,
      total_capacity,
      risk_level,
      status,
    } = body;

    // Validation
    if (!title || !apy_percent || !duration_months || !min_amount || !risk_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (apy_percent <= 0 || apy_percent > 100) {
      return NextResponse.json(
        { error: 'APY must be between 0.1 and 100' },
        { status: 400 }
      );
    }

    if (![1, 3, 6, 12].includes(duration_months)) {
      return NextResponse.json(
        { error: 'Duration must be 1, 3, 6, or 12 months' },
        { status: 400 }
      );
    }

    if (min_amount <= 0) {
      return NextResponse.json(
        { error: 'Minimum amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (max_amount && max_amount <= min_amount) {
      return NextResponse.json(
        { error: 'Maximum amount must be greater than minimum amount' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(risk_level)) {
      return NextResponse.json(
        { error: 'Risk level must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Create vault
    const { data: vault, error: createError } = await supabase
      .from('earn_vaults')
      .insert({
        title,
        subtitle,
        apy_percent,
        duration_months,
        min_amount,
        max_amount,
        total_capacity,
        risk_level,
        status: status || 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create vault:', createError);

      // Handle unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A vault with this title already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create vault' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vault,
      message: `Vault "${title}" created successfully`,
    });

  } catch (error) {
    console.error('Create vault API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

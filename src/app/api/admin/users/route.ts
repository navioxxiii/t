/**
 * Admin Users API
 * GET /api/admin/users - Get paginated users list with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const globalFilter = searchParams.get('globalFilter') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply global filter (search)
    if (globalFilter) {
      query = query.or(
        `email.ilike.%${globalFilter}%,full_name.ilike.%${globalFilter}%`
      );
    }

    // Apply role filter
    if (roleFilter && roleFilter !== '') {
      query = query.eq('role', roleFilter);
    }

    // Apply status filter (active/banned)
    if (statusFilter === 'active') {
      query = query.eq('is_banned', false);
    } else if (statusFilter === 'banned') {
      query = query.eq('is_banned', true);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply sorting
    const sortColumn = sortBy.split(',')[0]; // Handle multi-column sort (take first)
    const order = sortOrder.split(',')[0] as 'asc' | 'desc';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Apply pagination
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin Transactions API
 * GET /api/admin/transactions - Get all transactions with pagination and filters
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
    const typeFilter = searchParams.get('type') || '';
    const statusFilter = searchParams.get('status') || '';
    const coinFilter = searchParams.get('coin') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query with user email join
    let query = supabase
      .from('transactions')
      .select(`
        *,
        profiles!inner(email)
      `, { count: 'exact' });

    // Apply global filter (search)
    if (globalFilter) {
      // Search in tx_hash, addresses, and user email
      query = query.or(
        `tx_hash.ilike.%${globalFilter}%,to_address.ilike.%${globalFilter}%,from_address.ilike.%${globalFilter}%`
      );
    }

    // Apply type filter
    if (typeFilter && typeFilter !== '') {
      query = query.eq('type', typeFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== '') {
      query = query.eq('status', statusFilter);
    }

    // Apply coin filter
    if (coinFilter && coinFilter !== '') {
      query = query.eq('coin_symbol', coinFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply sorting
    const sortColumn = sortBy.split(',')[0];
    const order = sortOrder.split(',')[0] as 'asc' | 'desc';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Apply pagination
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Transform data to include user_email
    const transformedData = transactions?.map((tx: { profiles?: { email?: string } }) => ({
      ...tx,
      user_email: tx.profiles?.email || null,
      profiles: undefined, // Remove the nested profiles object
    }));

    return NextResponse.json({
      data: transformedData || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Admin transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin Users Export API
 * GET /api/admin/users/export - Export users list as CSV
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

    // Get query parameters (same as main endpoint)
    const searchParams = request.nextUrl.searchParams;
    const globalFilter = searchParams.get('globalFilter') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query (no pagination for export)
    let query = supabase.from('profiles').select('*');

    // Apply same filters as main endpoint
    if (globalFilter) {
      query = query.or(
        `email.ilike.%${globalFilter}%,full_name.ilike.%${globalFilter}%,id.eq.${globalFilter}`
      );
    }

    if (roleFilter && roleFilter !== '') {
      query = query.eq('role', roleFilter);
    }

    if (statusFilter === 'active') {
      query = query.eq('is_banned', false);
    } else if (statusFilter === 'banned') {
      query = query.eq('is_banned', true);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Generate CSV
    const csvHeaders = [
      'User ID',
      'Email',
      'Full Name',
      'Role',
      'Status',
      'Total Balance',
      'Registration Date',
      'Last Login',
      'Banned Reason',
    ];

    const csvRows = users?.map((u) => [
      u.id,
      u.email,
      u.full_name || '',
      u.role,
      u.is_banned ? 'Banned' : 'Active',
      u.balance?.toString() || '0',
      new Date(u.created_at).toISOString(),
      u.last_login_at ? new Date(u.last_login_at).toISOString() : '',
      u.is_banned ? (u.banned_reason || '') : '',
    ]);

    const csv = [
      csvHeaders.join(','),
      ...(csvRows || []).map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Admin users export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

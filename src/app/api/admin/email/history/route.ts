/**
 * Admin Email History API
 * GET - List email send history (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const globalFilter = searchParams.get('globalFilter') || '';
    const statusFilter = searchParams.get('status') || '';
    const categoryFilter = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Use admin client to join profiles for sent_by name
    const adminClient = createAdminClient();

    // Build count query
    let countQuery = adminClient
      .from('email_history')
      .select('*', { count: 'exact', head: true });

    if (globalFilter) {
      countQuery = countQuery.ilike('subject', `%${globalFilter}%`);
    }
    if (statusFilter && statusFilter !== 'all') {
      countQuery = countQuery.eq('status', statusFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      countQuery = countQuery.eq('category', categoryFilter);
    }
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo);
    }

    const { count: totalCount } = await countQuery;

    // Build data query — embeds an aggregate `email_replies(count)` so each
    // row carries `reply_count` for the history-table badge in one round trip.
    let query = adminClient
      .from('email_history')
      .select(
        '*, sent_by_profile:profiles!email_history_sent_by_fkey(email, full_name), email_replies(count)'
      );

    if (globalFilter) {
      query = query.ilike('subject', `%${globalFilter}%`);
    }
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    const { data: history, error } = await query;

    if (error) {
      console.error('Failed to fetch email history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Flatten the embedded aggregate to a flat `reply_count` number.
    const data = (history || []).map((row) => {
      const { email_replies, ...rest } = row as typeof row & {
        email_replies?: { count: number }[];
      };
      return {
        ...rest,
        reply_count: email_replies?.[0]?.count ?? 0,
      };
    });

    return NextResponse.json({
      data,
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('Email history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

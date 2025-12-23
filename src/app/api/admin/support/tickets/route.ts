/**
 * Admin Support Tickets API
 * GET /api/admin/support/tickets - Get all tickets with filters
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to'); // 'me', 'unassigned', or admin ID
    const isGuest = searchParams.get('is_guest'); // 'true' or 'false'
    const search = searchParams.get('search'); // search by ticket number, email, or subject
    const showDeleted = searchParams.get('show_deleted') === 'true'; // super_admin only

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user_profile:profiles!support_tickets_user_id_fkey(email, full_name, role),
        assigned_admin:profiles!support_tickets_assigned_to_fkey(email, full_name)
      `);

    // Filter deleted tickets based on role
    if (profile.role === 'super_admin') {
      // Super admin can see deleted tickets if show_deleted is true
      if (!showDeleted) {
        query = query.is('deleted_at', null);
      }
    } else {
      // Regular admin never sees deleted tickets
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assignedTo === 'me') {
      query = query.eq('assigned_to', user.id);
    } else if (assignedTo === 'unassigned') {
      query = query.is('assigned_to', null);
    } else if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (isGuest === 'true') {
      query = query.eq('is_guest', true);
    } else if (isGuest === 'false') {
      query = query.eq('is_guest', false);
    }

    if (search) {
      query = query.or(
        `ticket_number.ilike.%${search}%,user_email.ilike.%${search}%,subject.ilike.%${search}%`
      );
    }

    // Order by updated_at descending (most recent activity first)
    query = query.order('updated_at', { ascending: false });

    const { data: tickets, error: ticketsError } = await query;

    if (ticketsError) {
      console.error('Error fetching admin tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Get unread message counts for all tickets in a single query
    // This replaces the N+1 query pattern with a single grouped query
    const ticketIds = tickets.map((t) => t.id);

    let unreadCountsMap: Record<string, number> = {};

    if (ticketIds.length > 0) {
      // Single query to get unread counts for all tickets
      const { data: unreadData } = await supabase
        .from('ticket_messages')
        .select('ticket_id')
        .in('ticket_id', ticketIds)
        .eq('read_by_admin', false)
        .in('sender_type', ['user', 'guest'])
        .eq('is_internal_note', false);

      // Count messages per ticket using client-side aggregation
      if (unreadData) {
        unreadData.forEach((msg) => {
          unreadCountsMap[msg.ticket_id] = (unreadCountsMap[msg.ticket_id] || 0) + 1;
        });
      }
    }

    // Merge unread counts with tickets
    const ticketsWithUnread = tickets.map((ticket) => ({
      ...ticket,
      unread_count: unreadCountsMap[ticket.id] || 0,
    }));

    return NextResponse.json({ tickets: ticketsWithUnread });
  } catch (error) {
    console.error('Get admin tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

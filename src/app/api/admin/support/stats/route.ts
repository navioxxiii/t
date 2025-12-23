/**
 * Admin Support Stats API
 * GET /api/admin/support/stats
 * Returns aggregate statistics for support dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Run all count queries in parallel for better performance
    // This replaces loading ALL tickets into memory with targeted SQL counts
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      // Total count
      totalResult,
      // Status counts (run in parallel)
      openResult,
      pendingResult,
      inProgressResult,
      resolvedResult,
      closedResult,
      // Priority counts
      urgentResult,
      highResult,
      normalResult,
      lowResult,
      // Assignment counts
      unassignedResult,
      assignedResult,
      // User type counts
      guestResult,
      userResult,
      // Category counts - fetch all in one query using group by workaround
      categoryData,
      // Time-based counts
      last24HoursResult,
      last7DaysResult,
      // Unread messages
      unreadResult,
      // Top assigned admins - fetch raw data for aggregation
      assignmentData,
    ] = await Promise.all([
      // Total
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      // Status counts
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed').is('deleted_at', null),
      // Priority counts
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'urgent').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'high').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'normal').is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'low').is('deleted_at', null),
      // Assignment counts
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).is('assigned_to', null).is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('assigned_to', 'is', null).is('deleted_at', null),
      // User type counts
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('is_guest', true).is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('is_guest', false).is('deleted_at', null),
      // Category - fetch category column only for lightweight aggregation
      supabase.from('support_tickets').select('category').is('deleted_at', null),
      // Time-based counts
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo.toISOString()).is('deleted_at', null),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()).is('deleted_at', null),
      // Unread messages count
      supabase.from('ticket_messages').select('*', { count: 'exact', head: true }).eq('read_by_admin', false).in('sender_type', ['user', 'guest']),
      // Assignment data for top admins (only assigned_to column for lightweight aggregation)
      supabase.from('support_tickets').select('assigned_to').not('assigned_to', 'is', null).is('deleted_at', null),
    ]);

    // Calculate category breakdown from lightweight query
    const categoryBreakdown: Record<string, number> = {
      account: 0,
      transaction: 0,
      kyc: 0,
      ban_appeal: 0,
      technical: 0,
      'copy-trading': 0,
      'earn-package': 0,
      other: 0,
    };

    if (categoryData.data) {
      categoryData.data.forEach((ticket: { category: string }) => {
        if (ticket.category && categoryBreakdown[ticket.category] !== undefined) {
          categoryBreakdown[ticket.category]++;
        }
      });
    }

    // Calculate top assigned admins from lightweight query
    const assignmentCounts: Record<string, number> = {};
    if (assignmentData.data) {
      assignmentData.data.forEach((ticket: { assigned_to: string }) => {
        assignmentCounts[ticket.assigned_to] = (assignmentCounts[ticket.assigned_to] || 0) + 1;
      });
    }

    const topAssignedAdmins = Object.entries(assignmentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([adminId, count]) => ({ admin_id: adminId, count }));

    // Get admin details for top assigned admins
    if (topAssignedAdmins.length > 0) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', topAssignedAdmins.map(a => a.admin_id));

      topAssignedAdmins.forEach(admin => {
        const adminProfile = adminProfiles?.find(p => p.id === admin.admin_id);
        if (adminProfile) {
          Object.assign(admin, {
            email: adminProfile.email,
            full_name: adminProfile.full_name,
          });
        }
      });
    }

    const stats = {
      total: totalResult.count || 0,
      byStatus: {
        open: openResult.count || 0,
        pending: pendingResult.count || 0,
        in_progress: inProgressResult.count || 0,
        resolved: resolvedResult.count || 0,
        closed: closedResult.count || 0,
      },
      byPriority: {
        urgent: urgentResult.count || 0,
        high: highResult.count || 0,
        normal: normalResult.count || 0,
        low: lowResult.count || 0,
      },
      byAssignment: {
        assigned: assignedResult.count || 0,
        unassigned: unassignedResult.count || 0,
      },
      byUserType: {
        guest: guestResult.count || 0,
        authenticated: userResult.count || 0,
      },
      byCategory: categoryBreakdown,
      recentActivity: {
        last24Hours: last24HoursResult.count || 0,
        last7Days: last7DaysResult.count || 0,
      },
      unreadMessages: unreadResult.count || 0,
      topAssignedAdmins,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get admin support stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

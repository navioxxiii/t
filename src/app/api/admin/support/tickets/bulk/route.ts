/**
 * Admin Support Tickets Bulk Operations API
 * POST /api/admin/support/tickets/bulk - Perform bulk actions on tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type BulkAction = 'close' | 'resolve' | 'assign' | 'change_priority' | 'delete';

interface BulkRequest {
  ticketIds: string[];
  action: BulkAction;
  value?: string | null; // For assign (admin ID) or change_priority (priority value)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: BulkRequest = await request.json();
    const { ticketIds, action, value } = body;

    // Validate request
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'No tickets selected' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 tickets at a time
    if (ticketIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 tickets can be processed at once' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();
    let updates: Record<string, unknown> = { updated_at: now };
    let systemMessage = '';

    switch (action) {
      case 'close':
        updates = {
          ...updates,
          status: 'closed',
          closed_at: now,
        };
        systemMessage = `Ticket closed by ${profile.full_name || profile.email} (bulk action)`;
        break;

      case 'resolve':
        updates = {
          ...updates,
          status: 'resolved',
          resolved_at: now,
        };
        systemMessage = `Ticket resolved by ${profile.full_name || profile.email} (bulk action)`;
        break;

      case 'assign':
        if (value === undefined) {
          return NextResponse.json(
            { error: 'Admin ID required for assignment' },
            { status: 400 }
          );
        }
        updates = {
          ...updates,
          assigned_to: value || null,
          assigned_at: value ? now : null,
        };
        if (value) {
          // Get assignee name
          const { data: assignee } = await adminSupabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', value)
            .single();
          systemMessage = `Ticket assigned to ${assignee?.full_name || assignee?.email || 'admin'} (bulk action)`;
        } else {
          systemMessage = 'Ticket unassigned (bulk action)';
        }
        break;

      case 'change_priority':
        if (!value || !['low', 'normal', 'high', 'urgent'].includes(value)) {
          return NextResponse.json(
            { error: 'Valid priority required' },
            { status: 400 }
          );
        }
        updates = {
          ...updates,
          priority: value,
        };
        systemMessage = `Priority changed to ${value} (bulk action)`;
        break;

      case 'delete':
        // Only super_admin can bulk delete
        if (profile.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Only super admins can bulk delete tickets' },
            { status: 403 }
          );
        }
        updates = {
          ...updates,
          deleted_at: now,
          deleted_by: user.id,
        };
        systemMessage = `Ticket deleted by ${profile.full_name || profile.email} (bulk action)`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update all tickets
    const { error: updateError } = await adminSupabase
      .from('support_tickets')
      .update(updates)
      .in('id', ticketIds);

    if (updateError) {
      console.error('Bulk update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tickets' },
        { status: 500 }
      );
    }

    // Add system messages to all tickets
    if (systemMessage) {
      const systemMessages = ticketIds.map((ticketId) => ({
        ticket_id: ticketId,
        sender_type: 'system',
        sender_id: user.id,
        sender_email: profile.email,
        message: systemMessage,
        is_internal_note: false,
        read_by_user: false,
        read_by_admin: true,
      }));

      await adminSupabase.from('ticket_messages').insert(systemMessages);
    }

    return NextResponse.json({
      success: true,
      processed: ticketIds.length,
      action,
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * User Ticket Detail API
 * GET /api/support/tickets/[id] - Get ticket details with messages
 * PATCH /api/support/tickets/[id] - Update ticket (resolve/reopen)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get ticket (ensure it belongs to the user and is not deleted)
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*, assigned_admin:profiles!support_tickets_assigned_to_fkey(email, full_name)')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get all messages for this ticket (exclude internal notes)
    const { data: messages, error: messagesError } = await adminClient
      .from('ticket_messages')
      .select('*, sender:profiles!ticket_messages_sender_id_fkey(email, full_name)')
      .eq('ticket_id', ticketId)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching ticket messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark unread admin messages as read
    const unreadMessageIds = messages
      .filter(m => !m.read_by_user && m.sender_type === 'admin')
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await adminClient
        .from('ticket_messages')
        .update({ read_by_user: true, read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);
    }

    return NextResponse.json({
      ticket,
      messages,
    });
  } catch (error) {
    console.error('Get ticket detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { action } = body; // 'resolve' or 'reopen'

    if (!action || !['resolve', 'reopen'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "resolve" or "reopen"' },
        { status: 400 }
      );
    }

    // Get ticket (ensure it belongs to the user and is not deleted)
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update ticket status
    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'resolve') {
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        return NextResponse.json(
          { error: 'Ticket is already resolved or closed' },
          { status: 400 }
        );
      }
      updateData.status = 'resolved';
      updateData.resolved_at = new Date().toISOString();
    } else if (action === 'reopen') {
      if (ticket.status === 'open' || ticket.status === 'in_progress') {
        return NextResponse.json(
          { error: 'Ticket is already open' },
          { status: 400 }
        );
      }
      updateData.status = 'open';
      updateData.resolved_at = null;
      updateData.closed_at = null;
    }

    const { data: updatedTicket, error: updateError } = await adminClient
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Create a system message about the status change
    await adminClient.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'system',
      message: `Ticket marked as ${action === 'resolve' ? 'resolved' : 'reopened'} by user`,
      is_internal_note: false,
    });

    console.log(`✅ Ticket ${action}d by user:`, {
      ticket_number: ticket.ticket_number,
      user_id: user.id,
    });

    // TODO: Send email notification to assigned admin (if any)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

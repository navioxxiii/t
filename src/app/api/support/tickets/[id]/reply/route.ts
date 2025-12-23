/**
 * Reply to User Ticket API
 * POST /api/support/tickets/[id]/reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
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
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get ticket (ensure it belongs to the user)
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // If ticket is deleted, create a new ticket with this message (better UX)
    if (ticket.deleted_at) {
      // Get user profile
      const { data: profile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      // Generate ticket number (same logic as auto-create)
      const { data: latestTicket } = await adminClient
        .from('support_tickets')
        .select('ticket_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1000;
      if (latestTicket?.ticket_number) {
        const match = latestTicket.ticket_number.match(/TKT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const ticketNumber = `TKT-${String(nextNumber).padStart(6, '0')}`;

      // Create new ticket
      const { data: newTicket, error: newTicketError } = await adminClient
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: user.id,
          user_email: profile?.email || user.email,
          user_name: profile?.full_name,
          subject: ticket.subject.startsWith('Re: ') ? ticket.subject : `Re: ${ticket.subject}`,
          category: ticket.category,
          status: 'open',
          priority: 'normal',
          is_guest: false,
        })
        .select()
        .single();

      if (newTicketError || !newTicket) {
        console.error('Error creating new ticket:', newTicketError);
        return NextResponse.json(
          { error: 'Failed to create new ticket' },
          { status: 500 }
        );
      }

      // Create message on new ticket
      const { data: newMessage, error: messageError } = await adminClient
        .from('ticket_messages')
        .insert({
          ticket_id: newTicket.id,
          sender_id: user.id,
          sender_type: 'user',
          sender_email: user.email,
          message: message.trim(),
          read_by_user: true,
          read_by_admin: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error creating message:', messageError);
        // Rollback new ticket
        await adminClient.from('support_tickets').delete().eq('id', newTicket.id);
        return NextResponse.json(
          { error: 'Failed to send message' },
          { status: 500 }
        );
      }

      console.log('✅ New ticket created from deleted ticket reply:', {
        old_ticket: ticket.ticket_number,
        new_ticket: newTicket.ticket_number,
        user_id: user.id,
      });

      return NextResponse.json({
        success: true,
        message: newMessage,
        newTicket: {
          id: newTicket.id,
          ticket_number: newTicket.ticket_number,
          subject: newTicket.subject,
        },
      });
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket. Please create a new ticket.' },
        { status: 400 }
      );
    }

    // If ticket was resolved, move it back to open
    const statusUpdate: Record<string, string | null> = {};
    if (ticket.status === 'resolved') {
      statusUpdate.status = 'open';
      statusUpdate.resolved_at = null;
    }

    // Create the reply message
    const { data: newMessage, error: messageError } = await adminClient
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: 'user',
        sender_email: user.email,
        message: message.trim(),
        read_by_user: true, // User sent it, so it's already read by them
        read_by_admin: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating reply:', messageError);
      return NextResponse.json(
        { error: 'Failed to send reply' },
        { status: 500 }
      );
    }

    // Update ticket status and timestamp
    const { error: updateError } = await adminClient
      .from('support_tickets')
      .update({
        ...statusUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    console.log('✅ User replied to ticket:', {
      ticket_number: ticket.ticket_number,
      user_id: user.id,
    });

    // TODO: Send email notification to assigned admin (if any)
    // TODO: Send email notification to all admins if unassigned

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

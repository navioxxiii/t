/**
 * Reply to Guest Ticket API
 * POST /api/support/guest/[token]/reply
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const adminClient = createAdminClient();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get ticket by guest access token
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('guest_access_token', token)
      .eq('is_guest', true)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or invalid access token' },
        { status: 404 }
      );
    }

    // If ticket is deleted, create a new guest ticket with this message (better UX)
    if (ticket.deleted_at) {
      // Generate new guest access token
      const newGuestToken = crypto.randomUUID();

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

      // Create new guest ticket
      const { data: newTicket, error: newTicketError } = await adminClient
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_email: ticket.user_email,
          user_name: ticket.user_name,
          subject: ticket.subject.startsWith('Re: ') ? ticket.subject : `Re: ${ticket.subject}`,
          category: ticket.category,
          status: 'open',
          priority: 'normal',
          is_guest: true,
          guest_access_token: newGuestToken,
        })
        .select()
        .single();

      if (newTicketError || !newTicket) {
        console.error('Error creating new guest ticket:', newTicketError);
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
          sender_type: 'guest',
          sender_email: ticket.user_email,
          message: message.trim(),
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

      console.log('✅ New guest ticket created from deleted ticket reply:', {
        old_ticket: ticket.ticket_number,
        new_ticket: newTicket.ticket_number,
        email: ticket.user_email,
      });

      return NextResponse.json({
        success: true,
        message: {
          id: newMessage.id,
          sender_type: newMessage.sender_type,
          message: newMessage.message,
          created_at: newMessage.created_at,
        },
        newTicket: {
          id: newTicket.id,
          ticket_number: newTicket.ticket_number,
          subject: newTicket.subject,
          guest_access_token: newGuestToken,
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
    let statusUpdate = {};
    if (ticket.status === 'resolved') {
      statusUpdate = {
        status: 'open',
        resolved_at: null,
      };
    }

    // Create the reply message
    const { data: newMessage, error: messageError } = await adminClient
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'guest',
        sender_email: ticket.user_email,
        message: message.trim(),
        read_by_admin: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating guest reply:', messageError);
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
      .eq('id', ticket.id);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    console.log('✅ Guest replied to ticket:', {
      ticket_number: ticket.ticket_number,
      email: ticket.user_email,
    });

    // TODO: Send email notification to assigned admin (if any)
    // TODO: Send email notification to all admins if unassigned

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        sender_type: newMessage.sender_type,
        message: newMessage.message,
        created_at: newMessage.created_at,
      },
    });
  } catch (error) {
    console.error('Guest reply error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

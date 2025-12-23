/**
 * Get Guest Ticket by Token API
 * GET /api/support/guest/[token]
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
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

    // Get ticket by guest access token (excluding deleted)
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('*')
      .eq('guest_access_token', token)
      .eq('is_guest', true)
      .is('deleted_at', null)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or invalid access token' },
        { status: 404 }
      );
    }

    // Get all messages for this ticket (exclude internal notes)
    const { data: messages, error: messagesError } = await adminClient
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching ticket messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch ticket messages' },
        { status: 500 }
      );
    }

    // Mark unread messages as read by user
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
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        user_email: ticket.user_email,
        user_name: ticket.user_name,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        closed_at: ticket.closed_at,
      },
      messages: messages.map(m => ({
        id: m.id,
        sender_type: m.sender_type,
        sender_email: m.sender_email,
        message: m.message,
        created_at: m.created_at,
      })),
    });
  } catch (error) {
    console.error('Get guest ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * User Support Tickets API
 * GET /api/support/tickets - Get user's tickets
 * POST /api/support/tickets - Create new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSupportTicketCreatedEmail } from '@/lib/email/helpers';
import { isEmailConfigured } from '@/lib/email/service';

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

    const adminClient = createAdminClient();

    // Get user's tickets (excluding deleted)
    const { data: tickets, error: ticketsError } = await adminClient
      .from('support_tickets')
      .select('*, assigned_admin:profiles!support_tickets_assigned_to_fkey(email, full_name)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching user tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Get unread message counts for each ticket
    const ticketsWithUnread = await Promise.all(
      tickets.map(async (ticket) => {
        const { count } = await adminClient
          .from('ticket_messages')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id)
          .eq('read_by_user', false)
          .eq('sender_type', 'admin')
          .eq('is_internal_note', false);

        return {
          ...ticket,
          unread_count: count || 0,
        };
      })
    );

    return NextResponse.json({ tickets: ticketsWithUnread });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      subject,
      category,
      message,
      related_transaction_id,
      related_earn_position_id,
      related_copy_position_id,
    } = body;

    // Validate required fields
    if (!subject || !category || !message) {
      return NextResponse.json(
        { error: 'Subject, category, and message are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'account',
      'transaction',
      'kyc',
      'ban_appeal',
      'technical',
      'copy-trading',
      'earn-package',
      'other',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        user_email: profile.email,
        user_name: profile.full_name,
        subject: subject.trim(),
        category,
        status: 'open',
        priority: category === 'ban_appeal' ? 'urgent' : 'normal',
        is_guest: false,
        related_transaction_id: related_transaction_id || null,
        related_earn_position_id: related_earn_position_id || null,
        related_copy_position_id: related_copy_position_id || null,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Create the initial message
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_type: 'user',
        message: message.trim(),
        read_by_admin: false,
      });

    if (messageError) {
      console.error('Error creating ticket message:', messageError);
      // Rollback ticket creation
      await adminClient.from('support_tickets').delete().eq('id', ticket.id);
      return NextResponse.json(
        { error: 'Failed to create ticket message' },
        { status: 500 }
      );
    }

    console.log('✅ User ticket created:', {
      ticket_number: ticket.ticket_number,
      user_id: user.id,
      category: category,
    });

    // Send email confirmation to user
    if (isEmailConfigured()) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      try {
        await sendSupportTicketCreatedEmail({
          email: profile.email,
          recipientName: profile.full_name || undefined,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          category: ticket.category,
          ticketUrl: `${baseUrl}/support/${ticket.id}`,
          isGuest: false,
        });
        console.log('📧 Ticket confirmation email sent to:', profile.email);
      } catch (emailError) {
        // Don't fail ticket creation if email fails
        console.error('Failed to send ticket confirmation email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
      },
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

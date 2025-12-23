/**
 * Auto-Create Support Ticket API
 * POST /api/support/tickets/auto-create
 * Automatically creates a ticket for chat conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Check if user already has an active ticket
    const { data: existingTickets } = await adminClient
      .from('support_tickets')
      .select('id, ticket_number, status')
      .eq('user_id', user.id)
      .in('status', ['open', 'pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);

    // If there's already an active ticket, return it
    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({
        success: true,
        ticket: existingTickets[0],
        message: 'Using existing active ticket',
      });
    }

    // Get request body (optional initial message and subject)
    const body = await request.json().catch(() => ({}));
    const initialMessage = body.message || 'User started a chat conversation';
    const subject = body.subject || 'Chat conversation';

    // Generate unique ticket number (with retry logic for race conditions)
    let ticket = null;
    let ticketError = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !ticket) {
      attempts++;

      // Get the highest ticket number from the database
      const { data: latestTicket } = await adminClient
        .from('support_tickets')
        .select('ticket_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Parse the number from the ticket (e.g., "TKT-001234" -> 1234)
      let nextNumber = 1000; // Default starting number
      if (latestTicket?.ticket_number) {
        const match = latestTicket.ticket_number.match(/TKT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const ticketNumber = `TKT-${String(nextNumber).padStart(6, '0')}`;

      // Try to create new support ticket
      const result = await adminClient
        .from('support_tickets')
        .insert([
          {
            ticket_number: ticketNumber,
            user_id: user.id,
            user_email: profile.email,
            user_name: profile.full_name,
            subject: subject,
            category: 'other',
            priority: 'normal',
            status: 'open',
            is_guest: false,
          },
        ])
        .select()
        .single();

      ticket = result.data;
      ticketError = result.error;

      // If we got a duplicate key error, retry with a new number
      if (ticketError?.code === '23505' && attempts < maxAttempts) {
        console.log(`[Auto-create] Ticket number collision on attempt ${attempts}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // Exponential backoff
        continue;
      }

      break;
    }

    if (ticketError || !ticket) {
      console.error('[Auto-create] Error creating ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket after multiple attempts' },
        { status: 500 }
      );
    }

    // Create initial message
    const { error: messageError } = await adminClient
      .from('ticket_messages')
      .insert([
        {
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_type: 'user',
          sender_email: profile.email,
          message: initialMessage,
          is_internal_note: false,
          read_by_user: true, // User created it
          read_by_admin: false,
        },
      ]);

    if (messageError) {
      console.error('[Auto-create] Error creating message:', messageError);
      // Don't fail if message creation fails, ticket is created
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      },
      message: 'Ticket created successfully',
    });
  } catch (error) {
    console.error('[Auto-create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

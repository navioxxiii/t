/**
 * Create Guest Support Ticket API
 * POST /api/support/guest/create
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSupportTicketCreatedEmail } from '@/lib/email/helpers';
import { isEmailConfigured } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { email, name, subject, category, message } = body;

    // Validate required fields
    if (!email || !subject || !category || !message) {
      return NextResponse.json(
        { error: 'Email, subject, category, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate category for guests (only 'technical' and 'other' allowed)
    const allowedGuestCategories = ['technical', 'other'];
    if (!allowedGuestCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category for guest tickets. Only "technical" and "other" are allowed.' },
        { status: 400 }
      );
    }

    // Create the ticket
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .insert({
        user_email: email.toLowerCase().trim(),
        user_name: name?.trim() || null,
        subject: subject.trim(),
        category,
        status: 'open',
        priority: 'normal',
        is_guest: true,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating guest ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Create the initial message
    const { error: messageError } = await adminClient
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'guest',
        sender_email: email.toLowerCase().trim(),
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

    console.log('✅ Guest ticket created:', {
      ticket_number: ticket.ticket_number,
      email: email,
      category: category,
    });

    // Send email confirmation to guest with access link
    if (isEmailConfigured()) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      try {
        await sendSupportTicketCreatedEmail({
          email: email.toLowerCase().trim(),
          recipientName: name?.trim() || undefined,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          category: ticket.category,
          ticketUrl: `${baseUrl}/support/guest/${ticket.guest_access_token}`,
          isGuest: true,
        });
        console.log('📧 Guest ticket confirmation email sent to:', email);
      } catch (emailError) {
        // Don't fail ticket creation if email fails
        console.error('Failed to send guest ticket confirmation email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        access_token: ticket.guest_access_token,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at,
      },
    });
  } catch (error) {
    console.error('Guest ticket creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

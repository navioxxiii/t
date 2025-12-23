/**
 * Admin Reply to Ticket API
 * POST /api/admin/support/tickets/[id]/reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isEmailConfigured } from '@/lib/email/service';
import { sendSupportTicketReplyEmail } from '@/lib/email/helpers';
import { getAbsoluteUrl } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Cannot reply to a closed ticket' }, { status: 400 });
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: 'admin',
        sender_email: profile.email,
        message: message.trim(),
        read_by_user: false,
        read_by_admin: true,
        is_internal_note: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating reply:', messageError);
      return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }

    const statusUpdate: Record<string, string | Date> = {
      updated_at: new Date().toISOString(),
      last_replied_by: 'admin',
    };

    if (ticket.status === 'resolved' || ticket.status === 'pending' || ticket.status === 'open') {
      statusUpdate.status = 'in_progress';
    }

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update(statusUpdate)
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    // Send email notification
    if (isEmailConfigured()) {
      try {
        let recipientEmail: string | null = null;
        let recipientName: string | undefined;
        let ticketUrl: string;

        if (ticket.user_id) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', ticket.user_id)
            .single();
          recipientEmail = userProfile?.email || null;
          recipientName = userProfile?.full_name || undefined;
          ticketUrl = getAbsoluteUrl(`/support/${ticket.id}`);
        } else if (ticket.guest_email) {
          recipientEmail = ticket.guest_email;
          recipientName = 'Guest';
          ticketUrl = getAbsoluteUrl(`/support/guest?secret=${ticket.guest_secret}`);
        } else {
          throw new Error('No recipient email found for ticket');
        }

        if (recipientEmail) {
          await sendSupportTicketReplyEmail({
            email: recipientEmail,
            recipientName,
            replyContent: message.trim(),
            ticketUrl,
            ticketNumber: ticket.ticket_number,
          });
        }
      } catch (emailError) {
        console.error(`[Admin Reply] Failed to send email for ticket #${ticket.ticket_number}:`, emailError);
      }
    } else {
      console.warn(`[Admin Reply] Email service not configured. Skipping notification for ticket #${ticket.ticket_number}.`);
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Admin reply to ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


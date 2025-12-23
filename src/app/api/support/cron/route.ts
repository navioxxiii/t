/**
 * Support Cron Job API
 * POST /api/support/cron
 *
 * This endpoint is called by a cron job to perform automated ticket management.
 * - Sends inactivity reminders for tickets waiting on user response.
 * - Auto-closes resolved or inactive tickets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isEmailConfigured } from '@/lib/email/service';
import { sendSupportTicketInactivityReminderEmail } from '@/lib/email/helpers';
import { getAbsoluteUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createClient();

    // 1. Send inactivity reminders
    if (isEmailConfigured()) {
      const { data: reminderTickets, error: reminderError } = await supabase.rpc('send_inactivity_reminders');

      if (reminderError) {
        console.error('[Cron] Error calling send_inactivity_reminders:', reminderError);
      } else if (reminderTickets && reminderTickets.length > 0) {
        console.log(`[Cron] Sending ${reminderTickets.length} inactivity reminders.`);

        for (const { ticket_id } of reminderTickets) {
          try {
            const { data: ticket } = await supabase
              .from('support_tickets')
              .select('id, ticket_number, user_id, guest_email, guest_secret')
              .eq('id', ticket_id)
              .single();

            if (ticket) {
              let recipientEmail: string | null = null;
              let recipientName: string | undefined;
              let ticketUrl: string = ''; // Initialize ticketUrl here

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
              }

              if (recipientEmail) {
                await sendSupportTicketInactivityReminderEmail({
                  email: recipientEmail,
                  recipientName,
                  ticketUrl,
                  ticketNumber: ticket.ticket_number,
                });
              }
            }
          } catch (emailError) {
            console.error(`[Cron] Failed to send inactivity reminder for ticket #${ticket_id}:`, emailError);
          }
        }
      }
    } else {
      console.warn('[Cron] Email service not configured. Skipping inactivity reminders.');
    }

    // 2. Auto-close tickets
    const { error: closeError } = await supabase.rpc('auto_close_tickets');
    if (closeError) {
      console.error('[Cron] Error calling auto_close_tickets:', closeError);
    } else {
      console.log('[Cron] Auto-close ticket process completed.');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Cron] Support cron job failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

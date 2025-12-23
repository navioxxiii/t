/**
 * Mark Messages as Read API
 * POST /api/support/tickets/[id]/mark-read
 * Marks all admin messages in a ticket as read by the user
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

    // Verify ticket belongs to user
    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Mark all admin messages as read by user
    const { error: updateError } = await adminClient
      .from('ticket_messages')
      .update({
        read_by_user: true,
        read_at: new Date().toISOString(),
      })
      .eq('ticket_id', ticketId)
      .eq('sender_type', 'admin')
      .eq('read_by_user', false);

    if (updateError) {
      console.error('[Mark-Read] Error marking messages as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Mark-Read] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

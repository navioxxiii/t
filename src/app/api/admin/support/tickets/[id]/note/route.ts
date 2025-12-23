/**
 * Admin Internal Note API
 * POST /api/admin/support/tickets/[id]/note
 * Internal notes are only visible to admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createClient();

    // Check authentication and admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('ticket_number')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Create the internal note
    const { data: newNote, error: noteError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: 'admin',
        sender_email: profile.email,
        message: note.trim(),
        is_internal_note: true,
        read_by_admin: true,
        read_by_user: false, // User will never see this
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating internal note:', noteError);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    // Update ticket timestamp (but don't change status)
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    console.log('✅ Admin added internal note to ticket:', {
      ticket_number: ticket.ticket_number,
      admin: profile.email,
    });

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    console.error('Admin internal note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

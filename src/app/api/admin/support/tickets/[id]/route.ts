/**
 * Admin Ticket Detail API
 * GET /api/admin/support/tickets/[id] - Get ticket details with messages
 * PATCH /api/admin/support/tickets/[id] - Update ticket (status, priority, category, assignment)
 * DELETE /api/admin/support/tickets/[id] - Delete ticket (soft for admin, hard for super_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ticket with all related data
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name, role, is_banned),
        assigned_admin:profiles!support_tickets_assigned_to_fkey(id, email, full_name)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get all messages for this ticket (including internal notes for admins)
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*, sender:profiles!ticket_messages_sender_id_fkey(id, email, full_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching ticket messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get related transaction if exists
    let relatedTransaction = null;
    if (ticket.related_transaction_id) {
      const { data: txn } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', ticket.related_transaction_id)
        .single();
      relatedTransaction = txn;
    }

    // Get related earn position if exists
    let relatedEarnPosition = null;
    if (ticket.related_earn_position_id) {
      const { data: earn } = await supabase
        .from('earn_positions')
        .select('*, earn_packages(*)')
        .eq('id', ticket.related_earn_position_id)
        .single();
      relatedEarnPosition = earn;
    }

    // Get related copy position if exists
    let relatedCopyPosition = null;
    if (ticket.related_copy_position_id) {
      const { data: copy } = await supabase
        .from('copy_positions')
        .select('*')
        .eq('id', ticket.related_copy_position_id)
        .single();
      relatedCopyPosition = copy;
    }

    // Mark unread user messages as read by admin
    const unreadMessageIds = messages
      .filter(m => !m.read_by_admin && (m.sender_type === 'user' || m.sender_type === 'guest'))
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('ticket_messages')
        .update({ read_by_admin: true, read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);
    }

    return NextResponse.json({
      ticket,
      messages,
      relatedTransaction,
      relatedEarnPosition,
      relatedCopyPosition,
    });
  } catch (error) {
    console.error('Get admin ticket detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { action, status, priority, category, assigned_to } = body;

    // Get current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    const systemMessages: string[] = [];

    // Handle actions
    if (action) {
      switch (action) {
        case 'resolve':
          if (ticket.status === 'resolved' || ticket.status === 'closed') {
            return NextResponse.json(
              { error: 'Ticket is already resolved or closed' },
              { status: 400 }
            );
          }
          updateData.status = 'resolved';
          updateData.resolved_at = new Date().toISOString();
          systemMessages.push(`Ticket marked as resolved by ${profile.full_name || profile.email}`);
          break;

        case 'close':
          updateData.status = 'closed';
          updateData.closed_at = new Date().toISOString();
          if (!ticket.resolved_at) {
            updateData.resolved_at = new Date().toISOString();
          }
          systemMessages.push(`Ticket closed by ${profile.full_name || profile.email}`);
          break;

        case 'reopen':
          if (ticket.status === 'open' || ticket.status === 'in_progress') {
            return NextResponse.json(
              { error: 'Ticket is already open' },
              { status: 400 }
            );
          }
          updateData.status = 'open';
          updateData.resolved_at = null;
          updateData.closed_at = null;
          systemMessages.push(`Ticket reopened by ${profile.full_name || profile.email}`);
          break;

        case 'in_progress':
          updateData.status = 'in_progress';
          systemMessages.push(`Ticket marked as in progress by ${profile.full_name || profile.email}`);
          break;

        case 'restore':
          if (!ticket.deleted_at) {
            return NextResponse.json(
              { error: 'Ticket is not deleted' },
              { status: 400 }
            );
          }
          updateData.deleted_at = null;
          updateData.deleted_by = null;
          systemMessages.push(`Ticket restored by ${profile.full_name || profile.email}`);
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    }

    // Handle direct field updates
    if (status && !action) {
      if (!['open', 'pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
      if (status === 'resolved' && !ticket.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
        if (!ticket.resolved_at) {
          updateData.resolved_at = new Date().toISOString();
        }
      }
      systemMessages.push(`Status changed to ${status} by ${profile.full_name || profile.email}`);
    }

    if (priority) {
      if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        );
      }
      if (priority !== ticket.priority) {
        updateData.priority = priority;
        systemMessages.push(`Priority changed to ${priority} by ${profile.full_name || profile.email}`);
      }
    }

    if (category) {
      const validCategories = ['account', 'transaction', 'kyc', 'ban_appeal', 'technical', 'copy-trading', 'earn-package', 'other'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      if (category !== ticket.category) {
        updateData.category = category;
        systemMessages.push(`Category changed to ${category} by ${profile.full_name || profile.email}`);
      }
    }

    if (assigned_to !== undefined) {
      // assigned_to can be null (unassign) or a user ID
      if (assigned_to === null) {
        updateData.assigned_to = null;
        updateData.assigned_at = null;
        systemMessages.push(`Ticket unassigned by ${profile.full_name || profile.email}`);
      } else {
        // Verify the assigned user is an admin
        const { data: assignedAdmin } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', assigned_to)
          .single();

        if (!assignedAdmin || !['admin', 'super_admin'].includes(assignedAdmin.role)) {
          return NextResponse.json(
            { error: 'Invalid admin user for assignment' },
            { status: 400 }
          );
        }

        updateData.assigned_to = assigned_to;
        updateData.assigned_at = new Date().toISOString();
        systemMessages.push(`Ticket assigned to ${assignedAdmin.full_name || assignedAdmin.email} by ${profile.full_name || profile.email}`);
      }
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Create system messages
    for (const message of systemMessages) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        message,
        is_internal_note: false,
      });
    }

    console.log('✅ Ticket updated by admin:', {
      ticket_number: ticket.ticket_number,
      admin: profile.email,
      changes: updateData,
    });

    // TODO: Send email notification to user if status changed

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Update admin ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Only super_admin can hard delete
    if (hardDelete && profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can permanently delete tickets' },
        { status: 403 }
      );
    }

    // Get current ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // HARD DELETE - Permanently remove ticket and all messages
      console.log('🗑️ Hard deleting ticket:', {
        ticket_number: ticket.ticket_number,
        admin: profile.email,
      });

      // Delete all messages first (cascade should handle this, but being explicit)
      await supabase
        .from('ticket_messages')
        .delete()
        .eq('ticket_id', ticketId);

      // Delete the ticket
      const { error: deleteError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (deleteError) {
        console.error('Error hard deleting ticket:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete ticket' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Ticket permanently deleted',
        deletionType: 'hard',
      });
    } else {
      // SOFT DELETE - Mark as deleted
      console.log('🗑️ Soft deleting ticket:', {
        ticket_number: ticket.ticket_number,
        admin: profile.email,
      });

      const { data: updatedTicket, error: updateError } = await supabase
        .from('support_tickets')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        console.error('Error soft deleting ticket:', updateError);
        return NextResponse.json(
          { error: 'Failed to delete ticket' },
          { status: 500 }
        );
      }

      // Create system message about deletion
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        message: `Ticket deleted by ${profile.full_name || profile.email}`,
        is_internal_note: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Ticket deleted',
        deletionType: 'soft',
        ticket: updatedTicket,
      });
    }
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

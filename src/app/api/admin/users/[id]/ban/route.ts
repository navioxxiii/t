/**
 * Admin User Ban/Unban API
 * PATCH /api/admin/users/[id]/ban - Ban or unban a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { is_banned, reason } = body;

    // Validate input
    if (typeof is_banned !== 'boolean') {
      return NextResponse.json(
        { error: 'is_banned must be a boolean' },
        { status: 400 }
      );
    }

    // Prevent banning self
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot ban yourself' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      is_banned: boolean;
      banned_at: string | null;
      banned_reason: string | null;
      updated_at: string;
    } = {
      is_banned,
      banned_at: is_banned ? new Date().toISOString() : null,
      banned_reason: is_banned ? (reason || 'No reason provided') : null,
      updated_at: new Date().toISOString(),
    };

    // Update user ban status
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user ban status:', error);
      return NextResponse.json(
        { error: 'Failed to update user ban status' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to user about account ban/unban
    // Template needed: AccountBannedEmail and AccountUnbannedEmail
    // const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId);
    // if (userAuth?.user?.email) {
    //   if (is_banned) {
    //     await sendAccountBannedEmail({
    //       email: userAuth.user.email,
    //       recipientName: updatedUser.full_name || 'User',
    //       reason: reason || 'No reason provided',
    //       supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support/new`,
    //     });
    //   } else {
    //     await sendAccountUnbannedEmail({
    //       email: userAuth.user.email,
    //       recipientName: updatedUser.full_name || 'User',
    //     });
    //   }
    // }

    return NextResponse.json({
      message: is_banned
        ? 'User banned successfully'
        : 'User unbanned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin user ban API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

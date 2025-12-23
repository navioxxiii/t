/**
 * Admin Traders API Endpoint - Single Trader Operations
 * DELETE - Delete trader
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (super_admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if there are active copy positions for this trader
    const { data: activePositions } = await supabase
      .from('user_copy_positions')
      .select('id')
      .eq('trader_id', id)
      .eq('status', 'active')
      .limit(1);

    if (activePositions && activePositions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete trader with active copy positions. Please close all positions first.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('traders').delete().eq('id', id);

    if (error) {
      console.error('Error deleting trader:', error);
      return NextResponse.json({ error: 'Failed to delete trader' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single();
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { position_type, position_id, action, reason } = body;

    if (!position_id || !reason) {
      return NextResponse.json({ error: 'Position ID and reason required' }, { status: 400 });
    }

    const table = position_type === 'earn' ? 'user_earn_positions' : 'user_copy_positions';
    const newStatus = action === 'force_mature' ? 'matured' : 'closed';

    const { error } = await supabase
      .from(table)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', position_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
    }

    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'manage_position',
      details: { position_type, position_id, action, reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { user_id, reason } = body;

    if (!user_id || !reason) {
      return NextResponse.json({ error: 'User ID and reason required' }, { status: 400 });
    }

    // Get target user details
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email, email_verified')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.email_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Update email_verified status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    // Log the action
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'verify_email',
      target_user_id: user_id,
      target_user_email: targetUser.email,
      details: { reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

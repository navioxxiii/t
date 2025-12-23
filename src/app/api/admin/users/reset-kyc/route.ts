import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminClient.from('profiles').select('role, email').eq('id', user.id).single();
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, reason } = body;

    if (!user_id || !reason) {
      return NextResponse.json({ error: 'User ID and reason required' }, { status: 400 });
    }

    // Get target user details
    const { data: targetUser } = await adminClient
      .from('profiles')
      .select('email, kyc_status, kyc_tier')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset KYC status and tier
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        kyc_status: 'not_started',
        kyc_tier: null,
        kyc_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('KYC reset error:', updateError);
      return NextResponse.json({ error: `Failed to reset KYC: ${updateError.message}` }, { status: 500 });
    }

    // Log the action
    const { error: logError } = await adminClient.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'reset_kyc',
      target_user_id: user_id,
      target_user_email: targetUser.email,
      details: {
        previous_status: targetUser.kyc_status || 'not_started',
        previous_tier: targetUser.kyc_tier || 'none',
        reason,
      },
    });

    if (logError) {
      console.error('Admin log insert error:', logError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error resetting KYC:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

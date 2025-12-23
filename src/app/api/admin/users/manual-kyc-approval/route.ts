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
    const { user_id, tier, reason } = body;

    if (!user_id || !tier || !reason) {
      return NextResponse.json({ error: 'User ID, tier, and reason required' }, { status: 400 });
    }

    // Validate tier
    const validTiers = ['tier_1_basic', 'tier_2_advanced'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid KYC tier. Must be tier_1_basic or tier_2_advanced' }, { status: 400 });
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

    // Update KYC status and tier
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        kyc_status: 'approved',
        kyc_tier: tier,
        kyc_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('KYC update error:', updateError);
      return NextResponse.json({ error: `Failed to approve KYC: ${updateError.message}` }, { status: 500 });
    }

    // Log the action
    const { error: logError } = await adminClient.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'manual_kyc_approval',
      target_user_id: user_id,
      target_user_email: targetUser.email,
      details: {
        new_tier: tier,
        previous_status: targetUser.kyc_status || 'not_started',
        previous_tier: targetUser.kyc_tier || 'none',
        reason,
      },
    });

    if (logError) {
      console.error('Admin log insert error:', logError);
      // Don't fail the request if logging fails, but log it
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error approving KYC:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

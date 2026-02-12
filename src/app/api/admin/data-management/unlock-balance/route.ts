import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single();
    if (!profile || profile.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { user_email, base_token_code, amount, reason } = body;

    const { data: targetUser } = await supabaseAdmin.from('profiles').select('id').eq('email', user_email).single();
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: baseToken } = await supabaseAdmin.from('base_tokens').select('id').eq('code', base_token_code).single();
    if (!baseToken) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

    const { data: balance } = await supabaseAdmin
      .from('user_balances')
      .select('balance, locked_balance')
      .eq('user_id', targetUser.id)
      .eq('base_token_id', baseToken.id)
      .single();

    const current = parseFloat(balance?.balance || '0');
    const locked = parseFloat(balance?.locked_balance || '0');
    const unlockAmount = parseFloat(amount);

    if (unlockAmount > locked) {
      return NextResponse.json({ error: 'Unlock amount exceeds locked balance' }, { status: 400 });
    }

    await supabaseAdmin.from('user_balances').upsert({
      user_id: targetUser.id,
      base_token_id: baseToken.id,
      balance: (current + unlockAmount).toString(),
      locked_balance: (locked - unlockAmount).toString(),
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'unlock_balance',
      target_user_id: targetUser.id,
      target_user_email: user_email,
      details: { base_token_code, amount: unlockAmount, reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

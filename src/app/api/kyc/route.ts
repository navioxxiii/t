import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get KYC levels (tier_1_basic and tier_2_advanced)
    const { data: kycLimits, error: kycError } = await supabaseAdmin
      .from('kyc_transaction_limits')
      .select('*') // or specify columns: .select('tier, daily_limit, monthly_limit, ...')
      .in('tier', ['tier_1_basic', 'tier_2_advanced'])
      .order('daily_limit_usd', { ascending: true });

    if (kycError) {
      console.error('Error fetching KYC limits:', kycError);
      return NextResponse.json(
        { error: 'Failed to fetch KYC limits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: kycLimits || [] });

  } catch (error) {
    console.error('KYC limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

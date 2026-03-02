/**
 * Admin Email Recipients Preview API
 * GET - Preview recipient count and sample emails based on filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || '';
    const kycStatus = searchParams.get('kyc_status') || '';
    const isBanned = searchParams.get('is_banned');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('profiles')
      .select('email', { count: 'exact' })
      .eq('is_banned', false)
      .not('email', 'is', null);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    if (kycStatus && kycStatus !== 'all') {
      query = query.eq('kyc_status', kycStatus);
    }
    if (isBanned === 'true') {
      query = query.eq('is_banned', true);
    }

    // Get count
    const { count } = await query;

    // Get first 5 for preview
    let previewQuery = adminClient
      .from('profiles')
      .select('email')
      .eq('is_banned', false)
      .not('email', 'is', null)
      .limit(5);

    if (role && role !== 'all') {
      previewQuery = previewQuery.eq('role', role);
    }
    if (kycStatus && kycStatus !== 'all') {
      previewQuery = previewQuery.eq('kyc_status', kycStatus);
    }
    if (isBanned === 'true') {
      previewQuery = previewQuery.eq('is_banned', true);
    }

    const { data: previewData } = await previewQuery;

    return NextResponse.json({
      count: count || 0,
      preview: (previewData || []).map((p) => p.email).filter(Boolean),
    });
  } catch (error) {
    console.error('Email recipients preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

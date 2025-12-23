/**
 * Get Pending Sends API
 * Fetch all pending send requests for admin approval
 * Next.js 15 compatible
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch pending and admin_approved send requests with user and approver details
    // Admins see: pending requests
    // Super admins see: pending + admin_approved requests
    const statusFilter = profile.role === 'super_admin'
      ? ['pending', 'admin_approved']
      : ['pending'];

    const { data: pendingSends, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        id,
        amount,
        coin_symbol,
        to_address,
        status,
        processing_type,
        created_at,
        transaction_id,
        user_id,
        admin_approved_by,
        admin_approved_at,
        super_admin_approved_by,
        super_admin_approved_at,
        was_sent,
        sent_at,
        is_internal_transfer,
        recipient_user_id,
        profiles!withdrawal_requests_user_id_fkey (
          email,
          full_name
        ),
        admin_approver:profiles!withdrawal_requests_admin_approved_by_fkey (
          email,
          full_name
        ),
        recipient:profiles!withdrawal_requests_recipient_user_id_fkey (
          email,
          full_name
        ),
        transactions!withdrawal_requests_transaction_id_fkey (
          network_fee,
          notes
        )
      `)
      .in('status', statusFilter)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pending sends:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending sends' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pendingSends });
  } catch (error) {
    console.error('Pending sends API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

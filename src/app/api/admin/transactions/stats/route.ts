/**
 * Admin Transaction Statistics API
 * GET /api/admin/transactions/stats - Get transaction statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's transactions count
    const { count: todayCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Get today's volume (sum of amounts)
    const { data: todayVolumeData } = await supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const todayVolume = todayVolumeData?.reduce(
      (sum, tx) => sum + parseFloat(tx.amount || '0'),
      0
    ) || 0;

    // Get pending transactions count
    const { count: pendingCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get failed transactions count (today)
    const { count: failedCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    return NextResponse.json({
      todayTransactions: todayCount || 0,
      todayVolume: todayVolume.toFixed(2),
      pendingTransactions: pendingCount || 0,
      failedTransactions: failedCount || 0,
    });
  } catch (error) {
    console.error('Transaction stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

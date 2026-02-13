/**
 * User Self-Service Balance Initialization API
 * POST /api/user/initialize-balances
 * Allows users to initialize their own balances for all active tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserBalances } from '@/lib/users/balances';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await ensureUserBalances(user.id, { client: supabase });

    if (!result.success) {
      console.error('Error initializing balances:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to initialize balances' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      total: result.total,
      message:
        result.created > 0
          ? `Initialized ${result.created} token balances successfully`
          : 'All token balances already initialized',
    });
  } catch (error) {
    console.error('User initialize balances API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

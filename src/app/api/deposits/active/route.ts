/**
 * Get Active Deposit Payment API Endpoint
 * Returns any non-expired, non-terminal deposit for the user+token combination
 *
 * GET /api/deposits/active?base_token_id=X
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TERMINAL_STATUSES = ['finished', 'expired', 'failed', 'refunded'];

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get base_token_id from query params
    const { searchParams } = new URL(request.url);
    const baseTokenId = searchParams.get('base_token_id');

    if (!baseTokenId) {
      return NextResponse.json(
        { error: 'base_token_id is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Find active deposit for this user+token
    // Active = not terminal status AND not expired
    const { data: deposit, error } = await adminSupabase
      .from('deposit_payments')
      .select(
        `
        id,
        user_id,
        base_token_id,
        network_id,
        gateway,
        external_payment_id,
        pay_address,
        extra_id,
        expected_amount,
        pay_currency,
        status,
        expires_at,
        actually_paid,
        actually_paid_fiat,
        tx_hash,
        created_at,
        updated_at,
        base_tokens (
          id,
          code,
          symbol,
          name
        )
      `
      )
      .eq('user_id', user.id)
      .eq('base_token_id', baseTokenId)
      .not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch active deposit:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active deposit' },
        { status: 500 }
      );
    }

    // No active deposit found
    if (!deposit) {
      return NextResponse.json({ deposit: null });
    }

    // Type assertion for nested relation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseTokenRaw = deposit.base_tokens as any;
    const baseToken = Array.isArray(baseTokenRaw)
      ? baseTokenRaw[0]
      : baseTokenRaw as {
          id: number;
          code: string;
          symbol: string;
          name: string;
        } | null;

    // Calculate time remaining
    const expiresAt = deposit.expires_at
      ? new Date(deposit.expires_at)
      : null;
    const expiresInSeconds = expiresAt
      ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      : null;

    return NextResponse.json({
      deposit: {
        id: deposit.id,
        payment_id: deposit.external_payment_id,
        address: deposit.pay_address,
        extra_id: deposit.extra_id,
        expected_amount: deposit.expected_amount,
        currency: deposit.pay_currency.toUpperCase(),
        symbol: baseToken?.symbol || deposit.pay_currency.toUpperCase(),
        status: deposit.status,
        actually_paid: deposit.actually_paid,
        actually_paid_fiat: deposit.actually_paid_fiat,
        tx_hash: deposit.tx_hash,
        expires_at: deposit.expires_at,
        expires_in_seconds: expiresInSeconds,
        is_expired: expiresInSeconds !== null && expiresInSeconds <= 0,
        is_minimum_amount: true, // Active deposits fetched this way are assumed to be minimum
        created_at: deposit.created_at,
        updated_at: deposit.updated_at,
      },
    });
  } catch (error) {
    console.error('Get active deposit error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get active deposit',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get Deposit Payment Status API Endpoint
 * Check the status of an invoice-style deposit payment
 *
 * GET /api/deposits/[id]
 * - Returns current status from database
 * - Optionally refreshes from NOWPayments API with ?refresh=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { nowpayments } from '@/lib/nowpayments/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check for refresh param
    const { searchParams } = new URL(request.url);
    const shouldRefresh = searchParams.get('refresh') === 'true';

    // Look up deposit payment
    const adminSupabase = createAdminClient();
    const { data: depositPayment, error: fetchError } = await adminSupabase
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
      .eq('id', id)
      .single();

    if (fetchError || !depositPayment) {
      return NextResponse.json(
        { error: 'Deposit payment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (depositPayment.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Optionally refresh status from NOWPayments
    if (
      shouldRefresh &&
      depositPayment.gateway === 'nowpayments' &&
      !['finished', 'expired', 'failed'].includes(depositPayment.status)
    ) {
      try {
        const nowpaymentsStatus = await nowpayments.getPaymentStatus(
          depositPayment.external_payment_id
        );

        // Update if status changed
        if (nowpaymentsStatus.payment_status !== depositPayment.status) {
          const updateData: Record<string, unknown> = {
            status: nowpaymentsStatus.payment_status,
            updated_at: new Date().toISOString(),
          };

          if (nowpaymentsStatus.actually_paid > 0) {
            updateData.actually_paid = nowpaymentsStatus.actually_paid;
            updateData.actually_paid_fiat =
              nowpaymentsStatus.actually_paid_at_fiat;
          }

          if (nowpaymentsStatus.payin_hash) {
            updateData.tx_hash = nowpaymentsStatus.payin_hash;
          }

          const { data: updated } = await adminSupabase
            .from('deposit_payments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (updated) {
            // Merge updated data
            Object.assign(depositPayment, updated);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh payment status:', refreshError);
        // Continue with cached status
      }
    }

    // Calculate time remaining
    const expiresAt = depositPayment.expires_at
      ? new Date(depositPayment.expires_at)
      : null;
    const expiresInSeconds = expiresAt
      ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      : null;
    const isExpired = expiresInSeconds !== null && expiresInSeconds <= 0;

    // Auto-mark as expired if time is up and still waiting
    if (isExpired && depositPayment.status === 'waiting') {
      await adminSupabase
        .from('deposit_payments')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', id);
      depositPayment.status = 'expired';
    }

    // Type assertion for nested relation (Supabase returns object not array for single FK)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseTokenRaw = depositPayment.base_tokens as any;
    const baseToken = Array.isArray(baseTokenRaw)
      ? baseTokenRaw[0]
      : baseTokenRaw as {
          id: number;
          code: string;
          symbol: string;
          name: string;
        } | null;

    return NextResponse.json({
      deposit: {
        id: depositPayment.id,
        payment_id: depositPayment.external_payment_id,
        address: depositPayment.pay_address,
        extra_id: depositPayment.extra_id,
        expected_amount: depositPayment.expected_amount,
        currency: depositPayment.pay_currency.toUpperCase(),
        symbol: baseToken?.symbol || depositPayment.pay_currency.toUpperCase(),
        status: depositPayment.status,
        actually_paid: depositPayment.actually_paid,
        actually_paid_fiat: depositPayment.actually_paid_fiat,
        tx_hash: depositPayment.tx_hash,
        expires_at: depositPayment.expires_at,
        expires_in_seconds: expiresInSeconds,
        is_expired: isExpired,
        created_at: depositPayment.created_at,
        updated_at: depositPayment.updated_at,
      },
    });
  } catch (error) {
    console.error('Get deposit payment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get deposit payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

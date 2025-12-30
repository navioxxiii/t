/**
 * Create Deposit Payment API Endpoint
 * For invoice-style deposits (XRP, XLM, and other memo-based currencies)
 *
 * Creates a new NOWPayments payment with:
 * - Fresh address + destination tag combo
 * - Time-limited expiry (~20-60 minutes)
 * - Tracked in deposit_payments table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { nowpayments } from '@/lib/nowpayments/client';
import {
  getNowPaymentsCurrency,
  requiresInvoiceFlow,
  getWebhookUrl,
  PAYMENT_EXPIRY_MINUTES,
} from '@/lib/nowpayments/config';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { base_token_id, amount_usd } = body;

    if (!base_token_id) {
      return NextResponse.json(
        { error: 'base_token_id is required' },
        { status: 400 }
      );
    }

    // Look up base token to get currency code
    const adminSupabase = createAdminClient();
    const { data: baseToken, error: tokenError } = await adminSupabase
      .from('base_tokens')
      .select('id, code, symbol, name')
      .eq('id', base_token_id)
      .single();

    if (tokenError || !baseToken) {
      console.error('Failed to find base token:', tokenError);
      return NextResponse.json(
        { error: 'Invalid base_token_id' },
        { status: 400 }
      );
    }

    // Get NOWPayments currency code
    let currency: string;
    try {
      currency = getNowPaymentsCurrency(baseToken.code);
    } catch {
      return NextResponse.json(
        { error: `${baseToken.symbol} is not supported for invoice deposits` },
        { status: 400 }
      );
    }

    // Verify this currency requires invoice flow
    if (!requiresInvoiceFlow(currency)) {
      return NextResponse.json(
        {
          error: `${baseToken.symbol} uses permanent addresses, not invoice deposits`,
          hint: 'Use /api/wallets/generate to get a permanent deposit address',
        },
        { status: 400 }
      );
    }

    // Get network info for this currency
    const { data: deployment, error: deploymentError } = await adminSupabase
      .from('token_deployments')
      .select(
        `
        id,
        network_id,
        networks (
          id,
          code,
          name
        )
      `
      )
      .eq('base_token_id', base_token_id)
      .single();

    if (deploymentError) {
      console.error('Failed to find token deployment:', deploymentError);
    }

    const networkId = deployment?.network_id || null;

    // Get minimum amount from NOWPayments
    let minAmount: number;
    try {
      const minAmountResponse = await nowpayments.getMinimumAmount(
        'usd',
        currency
      );
      minAmount = minAmountResponse.min_amount;
    } catch (error) {
      console.error('Failed to get minimum amount:', error);
      // Default fallback minimum
      minAmount = 1;
    }

    // Use provided amount or minimum
    const userProvidedAmount = amount_usd && amount_usd >= minAmount;
    const priceAmount = userProvidedAmount ? amount_usd : minAmount;
    const isMinimumAmount = !userProvidedAmount;

    // Get webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const webhookUrl = getWebhookUrl(baseUrl);

    console.log('📥 Creating deposit payment:', {
      user_id: user.id,
      currency,
      price_amount: priceAmount,
      webhook_url: webhookUrl,
    });

    // Create NOWPayments payment
    const payment = await nowpayments.createPayment({
      price_amount: priceAmount,
      price_currency: 'usd',
      pay_currency: currency,
      order_id: user.id, // User ID for webhook identification
      order_description: `Invoice deposit for ${baseToken.symbol}`,
      ipn_callback_url: webhookUrl,
      is_fixed_rate: false, // CRITICAL: Allow variable amounts
    });

    console.log('✅ NOWPayments payment created:', {
      payment_id: payment.payment_id,
      pay_address: payment.pay_address,
      payin_extra_id: payment.payin_extra_id,
      pay_amount: payment.pay_amount,
      expiration: payment.expiration_estimate_date,
    });

    // Calculate expiry time
    const expiresAt = payment.expiration_estimate_date
      ? new Date(payment.expiration_estimate_date)
      : new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    // Store in deposit_payments table
    const { data: depositPayment, error: insertError } = await adminSupabase
      .from('deposit_payments')
      .insert({
        user_id: user.id,
        base_token_id: base_token_id,
        network_id: networkId,
        gateway: 'nowpayments',
        external_payment_id: payment.payment_id,
        pay_address: payment.pay_address,
        extra_id: payment.payin_extra_id || null,
        expected_amount: payment.pay_amount,
        pay_currency: currency,
        status: 'waiting',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store deposit payment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create deposit record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deposit: {
        id: depositPayment.id,
        payment_id: payment.payment_id,
        address: payment.pay_address,
        extra_id: payment.payin_extra_id || null,
        expected_amount: payment.pay_amount,
        expected_amount_usd: priceAmount,
        currency: currency.toUpperCase(),
        symbol: baseToken.symbol,
        status: 'waiting',
        expires_at: expiresAt.toISOString(),
        expires_in_seconds: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        minimum_amount_usd: minAmount,
        is_minimum_amount: isMinimumAmount,
      },
    });
  } catch (error) {
    console.error('Create deposit payment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create deposit payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

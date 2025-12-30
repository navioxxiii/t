/**
 * NOWPayments Webhook (IPN) Verification
 * CRITICAL for security - prevents fake deposit notifications
 *
 * NOWPayments uses HMAC-SHA512 for signature verification.
 * The signature is sent in the x-nowpayments-sig header.
 *
 * Steps to verify:
 * 1. Sort the callback body alphabetically by keys
 * 2. JSON.stringify the sorted object
 * 3. Create HMAC-SHA512 hash with IPN secret key
 * 4. Compare with x-nowpayments-sig header
 *
 * Documentation: https://nowpayments.io/help/what-is/what-is-ipn
 */

import crypto from 'crypto';
import type { NowPaymentsIPNCallback, NowPaymentsPayoutIPNCallback } from './types';

const IPN_SECRET_KEY = process.env.NOWPAYMENTS_IPN_SECRET!;

/**
 * Sort object keys recursively (alphabetically)
 * Required for signature verification
 */
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? sortObjectKeys(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      sorted[key] = sortObjectKeys(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}

/**
 * Verify NOWPayments IPN (webhook) signature
 *
 * @param body Parsed JSON body from webhook request
 * @param signature Value from x-nowpayments-sig header
 * @param secret IPN secret key (optional, uses env var if not provided)
 * @returns true if signature is valid, false otherwise
 */
export function verifyNowPaymentsSignature(
  body: Record<string, unknown> | NowPaymentsIPNCallback,
  signature: string,
  secret?: string
): boolean {
  try {
    const secretKey = secret || IPN_SECRET_KEY;

    if (!secretKey) {
      console.error('NOWPAYMENTS_IPN_SECRET not configured');
      return false;
    }

    if (!signature) {
      console.error('Missing signature in webhook request');
      return false;
    }

    // Sort the body alphabetically by keys
    const sortedBody = sortObjectKeys(body as Record<string, unknown>);

    // Convert to JSON string with no spaces
    const jsonString = JSON.stringify(sortedBody);

    // Calculate HMAC-SHA512
    const hmac = crypto.createHmac('sha512', secretKey);
    hmac.update(jsonString);
    const expectedSignature = hmac.digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      console.error('NOWPayments webhook signature verification failed!');
      console.error('JSON string (first 200 chars):', jsonString.substring(0, 200));
      console.error('Expected:', expectedSignature);
      console.error('Received:', signature);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying NOWPayments signature:', error);
    return false;
  }
}

/**
 * Validate payment callback data has required fields
 *
 * @param data Callback data
 * @returns true if all required fields present
 */
export function validatePaymentCallback(
  data: unknown
): data is NowPaymentsIPNCallback {
  if (!data || typeof data !== 'object') {
    console.error('Invalid callback data: not an object');
    return false;
  }

  const requiredFields = [
    'payment_id',
    'payment_status',
    'pay_address',
    'pay_currency',
    'actually_paid',
  ];

  const dataObj = data as Record<string, unknown>;

  for (const field of requiredFields) {
    if (dataObj[field] === undefined || dataObj[field] === null) {
      console.error(`Missing required field in payment callback: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Validate payout callback data has required fields
 *
 * @param data Callback data
 * @returns true if all required fields present
 */
export function validatePayoutCallback(
  data: unknown
): data is NowPaymentsPayoutIPNCallback {
  if (!data || typeof data !== 'object') {
    console.error('Invalid callback data: not an object');
    return false;
  }

  const requiredFields = ['id', 'address', 'currency', 'amount', 'status'];

  const dataObj = data as Record<string, unknown>;

  for (const field of requiredFields) {
    if (dataObj[field] === undefined || dataObj[field] === null) {
      console.error(`Missing required field in payout callback: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Map NOWPayments payment status to internal status
 *
 * @param status NOWPayments payment status
 * @returns Internal status string
 */
export function mapPaymentStatus(
  status: string
): 'pending' | 'completed' | 'failed' | 'expired' {
  switch (status) {
    case 'waiting':
    case 'confirming':
    case 'confirmed':
    case 'sending':
      return 'pending';

    case 'finished':
    case 'partially_paid': // With is_fixed_rate: false, accept any amount sent
      return 'completed';

    case 'failed':
    case 'refunded':
      return 'failed';

    case 'expired':
      return 'expired';

    default:
      console.warn(`Unknown NOWPayments status: ${status}`);
      return 'pending';
  }
}

/**
 * Map NOWPayments payout status to internal status
 *
 * @param status NOWPayments payout status
 * @returns Internal status string
 */
export function mapPayoutStatus(
  status: string
): 'pending' | 'completed' | 'failed' {
  switch (status) {
    case 'WAITING':
    case 'PENDING':
    case 'SENDING':
      return 'pending';

    case 'FINISHED':
      return 'completed';

    case 'FAILED':
    case 'REJECTED':
    case 'EXPIRED':
      return 'failed';

    default:
      console.warn(`Unknown NOWPayments payout status: ${status}`);
      return 'pending';
  }
}

/**
 * Check if payment status indicates completion
 *
 * @param status NOWPayments payment status
 * @returns true if payment is finished
 */
export function isPaymentComplete(status: string): boolean {
  return status === 'finished';
}

/**
 * Check if payment status indicates it's still pending
 *
 * @param status NOWPayments payment status
 * @returns true if payment is still being processed
 */
export function isPaymentPending(status: string): boolean {
  return ['waiting', 'confirming', 'confirmed', 'sending'].includes(status);
}

/**
 * Check if we should credit balance for this status
 * Credit when payment is confirmed, finished, or partially_paid
 *
 * @param status NOWPayments payment status
 * @returns true if balance should be credited
 */
export function shouldCreditBalance(status: string): boolean {
  // Credit on confirmed (lock), finished (unlock), or partially_paid (accept any amount with is_fixed_rate: false)
  return ['confirmed', 'finished', 'partially_paid'].includes(status);
}

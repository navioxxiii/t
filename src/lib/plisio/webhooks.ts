/**
 * Plisio Webhook Verification
 * CRITICAL for security - prevents fake deposit notifications
 */

import crypto from 'crypto';
import type { PlisioCallback } from './types';

const SECRET_KEY = process.env.PLISIO_SECRET_KEY!;

/**
 * Serialize a value to PHP serialize format
 * PHP serialize format: s:length:"value"; for strings
 */
function phpSerializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N;';
  }
  if (typeof value === 'boolean') {
    return `b:${value ? 1 : 0};`;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `i:${value};`;
    }
    return `d:${value};`;
  }
  // Convert everything else to string
  const str = String(value);
  return `s:${str.length}:"${str}";`;
}

/**
 * Serialize an object to PHP serialize format
 * PHP serialize format for arrays: a:count:{key-value pairs}
 *
 * Example: { "amount": "0.001", "currency": "BTC" }
 * Becomes: a:2:{s:6:"amount";s:5:"0.001";s:8:"currency";s:3:"BTC";}
 */
function phpSerialize(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort(); // ksort equivalent
  const pairs = keys.map(key => {
    const keyPart = `s:${key.length}:"${key}";`;
    const valuePart = phpSerializeValue(obj[key]);
    return keyPart + valuePart;
  });
  return `a:${keys.length}:{${pairs.join('')}}`;
}

/**
 * Verify Plisio webhook signature
 * This prevents malicious actors from sending fake deposit notifications
 *
 * How it works:
 * 1. Plisio sends a POST request with callback data
 * 2. They include a verify_hash calculated using HMAC-SHA1
 * 3. We recalculate the hash using PHP serialize format and compare
 * 4. If they match, the webhook is authentic
 *
 * Algorithm (from Plisio docs):
 * - Remove verify_hash from data
 * - Sort remaining fields alphabetically (ksort)
 * - Serialize using PHP serialize format
 * - Calculate HMAC-SHA1 with secret key
 *
 * @param data Callback data from Plisio webhook
 * @returns true if signature is valid, false otherwise
 */
export function verifyPlisioCallback(data: PlisioCallback): boolean {
  try {
    // Extract verify_hash from the data
    const { verify_hash: receivedHash, ...callbackData } = data;

    if (!receivedHash) {
      console.error('Missing verify_hash in callback data');
      return false;
    }

    // Serialize to PHP format (keys are sorted inside phpSerialize)
    const serialized = phpSerialize(callbackData as Record<string, unknown>);

    // Calculate expected hash: HMAC-SHA1(serialized, secret_key)
    const expectedHash = crypto
      .createHmac('sha1', SECRET_KEY)
      .update(serialized)
      .digest('hex');

    // DEBUG: Uncomment to see serialization details
    // console.log('🔍 DEBUG - Sorted keys:', Object.keys(callbackData).sort());
    // console.log('🔍 DEBUG - Serialized string:', serialized);
    // console.log('🔍 DEBUG - Secret key length:', SECRET_KEY?.length);
    // console.log('🔍 DEBUG - Expected hash:', expectedHash);
    // console.log('🔍 DEBUG - Received hash:', receivedHash);

    // Compare hashes
    const isValid = expectedHash === receivedHash;

    if (!isValid) {
      console.error('Webhook signature verification failed!');
      console.error('Serialized data:', serialized);
      console.error('Expected:', expectedHash);
      console.error('Received:', receivedHash);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying Plisio callback:', error);
    return false;
  }
}

/**
 * Validate callback data has required fields
 * Additional safety check before processing
 *
 * @param data Callback data
 * @returns true if all required fields present
 */
export function validateCallbackData(data: unknown): data is PlisioCallback {
  // Type guard: check if data is an object
  if (!data || typeof data !== 'object') {
    console.error('Invalid callback data: not an object');
    return false;
  }

  const requiredFields = [
    'txn_id',
    'amount',
    'currency',
    'status',
    // 'order_number',
    'verify_hash',
  ];

  const dataObj = data as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!dataObj[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}

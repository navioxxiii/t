/**
 * Plisio Webhook Verification
 * CRITICAL for security - prevents fake deposit notifications
 */

import crypto from 'crypto';
import type { PlisioCallback } from './types';

const SECRET_KEY = process.env.PLISIO_SECRET_KEY!;

/**
 * Verify Plisio webhook signature
 * This prevents malicious actors from sending fake deposit notifications
 *
 * How it works:
 * 1. Plisio sends a POST request with callback data
 * 2. They include a verify_hash calculated from the data + your secret key
 * 3. We recalculate the hash and compare
 * 4. If they match, the webhook is authentic
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

    // Build the verification string
    // Plisio's algorithm: Sort params alphabetically, concatenate values, add secret key
    const sortedKeys = Object.keys(callbackData).sort();
    const valueString = sortedKeys
      .map(key => callbackData[key as keyof typeof callbackData])
      .join('');

    // Calculate expected hash: SHA1(values + secret_key)
    const expectedHash = crypto
      .createHash('sha1')
      .update(valueString + SECRET_KEY)
      .digest('hex');

    // Compare hashes
    const isValid = expectedHash === receivedHash;

    if (!isValid) {
      console.error('Webhook signature verification failed!');
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

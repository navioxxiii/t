/**
 * Plisio Webhook Verification
 * CRITICAL for security - prevents fake deposit notifications
 *
 * IMPORTANT: For Node.js/non-PHP languages, Plisio uses JSON.stringify for hash calculation
 * when callback_url includes ?json=true parameter.
 * See: https://plisio.net/documentation/endpoints/create-an-invoice
 */

import crypto from 'crypto';
import type { PlisioCallback } from './types';

const SECRET_KEY = process.env.PLISIO_SECRET_KEY!;

/**
 * Verify Plisio webhook signature using JSON method (for Node.js)
 * This is the official Plisio Node.js verification approach.
 *
 * From Plisio docs:
 * ```javascript
 * const ordered = {...data};
 * delete ordered.verify_hash;
 * const string = JSON.stringify(ordered);
 * const hmac = crypto.createHmac('sha1', secretKey);
 * hmac.update(string);
 * const hash = hmac.digest('hex');
 * return hash === data.verify_hash;
 * ```
 *
 * IMPORTANT: callback_url must include ?json=true for this to work!
 *
 * @param data Callback data from Plisio webhook
 * @returns true if signature is valid, false otherwise
 */
export function verifyPlisioCallback(data: PlisioCallback): boolean {
  try {
    if (!data.verify_hash) {
      console.error('Missing verify_hash in callback data');
      return false;
    }

    if (!SECRET_KEY) {
      console.error('PLISIO_SECRET_KEY not configured');
      return false;
    }

    const receivedHash = data.verify_hash;

    // Create ordered copy without verify_hash (per Plisio Node.js docs)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verify_hash: _, ...ordered } = data;

    // JSON stringify (this is what Plisio Node.js example uses)
    const jsonString = JSON.stringify(ordered);

    // Calculate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', SECRET_KEY);
    hmac.update(jsonString);
    const expectedHash = hmac.digest('hex');

    const isValid = expectedHash === receivedHash;

    if (!isValid) {
      console.error('Webhook signature verification failed!');
      console.error('JSON string:', jsonString.substring(0, 200) + '...');
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

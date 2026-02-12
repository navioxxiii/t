/**
 * ⚠️ SECURITY CRITICAL: Password Encryption Utilities
 *
 * This module handles encryption/decryption of passwords for audit storage.
 * DO NOT use these utilities for authentication - use Supabase Auth.
 *
 * Encryption: AES-256-GCM
 * Key Storage: Environment variable (PASSWORD_ENCRYPTION_KEY)
 *
 * @module password-encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY environment variable not set');
  }

  // Convert hex string to buffer (must be 64 hex chars = 32 bytes)
  if (key.length !== 64) {
    throw new Error('PASSWORD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a password for audit storage
 * Returns: base64-encoded string with IV + encrypted data + auth tag
 *
 * @param password - The plaintext password to encrypt
 * @returns Encrypted password as base64 string
 */
export function encryptPassword(password: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine: IV + encrypted data + auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Password encryption failed:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt a password from audit storage
 * Input: base64-encoded string with IV + encrypted data + auth tag
 *
 * @param encryptedData - The encrypted password as base64 string
 * @returns Decrypted plaintext password
 */
export function decryptPassword(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Password decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Generate a secure encryption key (run once, store in .env)
 * Returns 64 hex characters (32 bytes)
 *
 * @returns Encryption key as 64-character hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

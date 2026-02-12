/**
 * Generate Encryption Key Script
 *
 * Generates a secure AES-256 encryption key for password audit storage.
 * Run this once and add the output to your .env.local file.
 *
 * Usage:
 *   npx tsx scripts/generate-encryption-key.ts
 */

import { generateEncryptionKey } from '../src/lib/security/password-encryption';

console.log('='.repeat(80));
console.log('Password Audit Encryption Key Generator');
console.log('='.repeat(80));
console.log('');
console.log('⚠️  SECURITY WARNING:');
console.log('   This key will be used to encrypt/decrypt passwords in the audit table.');
console.log('   Keep it secret and secure. If compromised, all audit passwords are exposed.');
console.log('');
console.log('Generated encryption key (AES-256):');
console.log('');
console.log(generateEncryptionKey());
console.log('');
console.log('='.repeat(80));
console.log('Add this to your .env.local file:');
console.log('');
console.log('PASSWORD_ENCRYPTION_KEY=<key-above>');
console.log('');
console.log('IMPORTANT:');
console.log('  1. Never commit this key to version control');
console.log('  2. Store it securely in your environment variables');
console.log('  3. Back it up in a secure location (e.g., password manager)');
console.log('  4. If the key is lost, encrypted passwords cannot be recovered');
console.log('='.repeat(80));

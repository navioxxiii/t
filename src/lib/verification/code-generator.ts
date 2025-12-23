/**
 * Verification Code Generator
 * Generates secure 6-digit codes for email verification
 */

import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit code
 */
export function generateVerificationCode(): string {
  // Generate random 6-digit number (100000-999999)
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

/**
 * Store verification code in database
 */
export async function storeVerificationCode(
  userId: string,
  code: string,
  codeType: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<void> {
  const supabase = createAdminClient();

  // Delete any existing codes for this user and code type
  await supabase
    .from('verification_codes')
    .delete()
    .eq('user_id', userId)
    .eq('code_type', codeType);

  // Insert new code
  const { error } = await supabase
    .from('verification_codes')
    .insert({
      user_id: userId,
      code,
      code_type: codeType,
      attempts: 0,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

  if (error) {
    console.error('[Code Generator] Error storing code:', error);
    throw new Error('Failed to store verification code');
  }
}

/**
 * Verify code matches the user's latest code
 */
export async function verifyCode(
  userId: string,
  code: string,
  codeType: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get the latest code for this user and code type
  const { data: codeData, error: fetchError } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code_type', codeType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !codeData) {
    return { success: false, error: 'No verification code found. Please request a new one.' };
  }

  // Check if code has expired
  if (new Date(codeData.expires_at) < new Date()) {
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Check if max attempts reached
  if (codeData.attempts >= 5) {
    return { success: false, error: 'Maximum attempts reached. Please request a new code.' };
  }

  // Check if code matches
  if (codeData.code !== code) {
    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: codeData.attempts + 1 })
      .eq('id', codeData.id);

    return { success: false, error: `Invalid code. ${5 - (codeData.attempts + 1)} attempts remaining.` };
  }

  // Success! Delete the code
  await supabase
    .from('verification_codes')
    .delete()
    .eq('id', codeData.id);

  return { success: true };
}

/**
 * Delete verification code for a user
 */
export async function deleteVerificationCode(
  userId: string,
  codeType: 'email_verification' | 'password_reset'
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('verification_codes')
    .delete()
    .eq('user_id', userId)
    .eq('code_type', codeType);

  if (error) {
    console.error('[Code Generator] Error deleting code:', error);
    throw new Error('Failed to delete verification code');
  }
}

/**
 * Cleanup expired codes (can be called by cron or API)
 */
export async function cleanupExpiredCodes() {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('verification_codes')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[Code Generator] Error cleaning up expired codes:', error);
  }
}

/**
 * ⚠️ SECURITY CRITICAL: Password Audit Utilities
 *
 * Functions to store and retrieve password audit records.
 * All operations are logged to admin_action_logs.
 *
 * @module password-audit
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { encryptPassword, decryptPassword } from './password-encryption';

export type PasswordSetMethod = 'registration' | 'admin_creation' | 'password_reset' | 'password_change';

/**
 * Store a password in the audit table (encrypted)
 *
 * @param params - Password audit parameters
 * @param params.userId - User ID whose password is being stored
 * @param params.password - Plaintext password to encrypt and store
 * @param params.method - How the password was set
 * @param params.setByUserId - Admin user ID (for admin_creation method)
 */
export async function storePasswordAudit(params: {
  userId: string;
  password: string;
  method: PasswordSetMethod;
  setByUserId?: string;
}): Promise<void> {
  const { userId, password, method, setByUserId } = params;
  const supabaseAdmin = createAdminClient();

  try {
    // Encrypt password
    const encryptedPassword = encryptPassword(password);

    // Store in audit table
    const { error } = await supabaseAdmin
      .from('user_password_audit')
      .insert({
        user_id: userId,
        encrypted_password: encryptedPassword,
        password_set_method: method,
        set_by_user_id: setByUserId || null,
      });

    if (error) {
      console.error('Failed to store password audit record:', error);
      // Don't throw - this shouldn't break the main flow
    }
  } catch (error) {
    console.error('Password audit storage error:', error);
    // Log error but don't throw - audit storage is secondary
  }
}

/**
 * Retrieve password history for a user (super_admin only)
 * Returns decrypted passwords with metadata
 *
 * @param params - Retrieval parameters
 * @param params.userId - User ID whose history to retrieve
 * @param params.requestingAdminId - Admin requesting the data
 * @param params.requestingAdminEmail - Admin email for logging
 * @returns Array of password records with decrypted passwords
 */
export async function getUserPasswordHistory(params: {
  userId: string;
  requestingAdminId: string;
  requestingAdminEmail: string;
}): Promise<Array<{
  id: string;
  password: string;
  method: PasswordSetMethod;
  setByUserId: string | null;
  createdAt: string;
}>> {
  const { userId, requestingAdminId, requestingAdminEmail } = params;
  const supabaseAdmin = createAdminClient();

  try {
    // Fetch encrypted records
    const { data: records, error } = await supabaseAdmin
      .from('user_password_audit')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch password history: ${error.message}`);
    }

    // Log access to admin action logs
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: requestingAdminId,
      admin_email: requestingAdminEmail,
      action_type: 'view_password_history',
      target_user_id: userId,
      details: {
        records_accessed: records?.length || 0,
        access_timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // Decrypt passwords
    return (records || []).map(record => ({
      id: record.id,
      password: decryptPassword(record.encrypted_password),
      method: record.password_set_method,
      setByUserId: record.set_by_user_id,
      createdAt: record.created_at,
    }));
  } catch (error) {
    console.error('Failed to retrieve password history:', error);
    throw error;
  }
}

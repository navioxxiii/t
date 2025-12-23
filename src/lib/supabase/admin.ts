/**
 * Supabase Admin Client
 * Uses service role key for admin operations
 * ONLY use in server-side code (API routes, server components)
 * NEVER expose to client
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create admin client with service role privileges
 * This bypasses RLS and has full database access
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // No NEXT_PUBLIC_ prefix!

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

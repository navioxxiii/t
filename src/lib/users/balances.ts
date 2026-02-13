import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EnsureUserBalancesOptions {
  tokenId?: number;
  client?: SupabaseClient;
}

export interface EnsureUserBalancesResult {
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  error?: string;
  details?: unknown;
}

/**
 * Ensures a user has balance records for all active base tokens.
 *
 * This function is idempotent and can be safely called multiple times.
 * It uses UPSERT with ignoreDuplicates to avoid duplicate key errors.
 *
 * @param userId - The user ID to create balances for
 * @param options - Optional configuration
 * @param options.tokenId - If provided, only ensures balance for this specific token
 * @param options.client - Custom Supabase client (defaults to admin client)
 * @returns Result object with success status and counts of created/skipped/total balances
 *
 * @example
 * ```typescript
 * // Create balances for all active tokens
 * const result = await ensureUserBalances('user-123');
 * console.log(`Created ${result.created}, skipped ${result.skipped}`);
 *
 * // Create balance for specific token only
 * const result = await ensureUserBalances('user-123', { tokenId: 5 });
 *
 * // Use custom client (e.g., for transactions)
 * const result = await ensureUserBalances('user-123', { client: supabase });
 * ```
 */
export async function ensureUserBalances(
  userId: string,
  options?: EnsureUserBalancesOptions
): Promise<EnsureUserBalancesResult> {
  const { tokenId, client } = options || {};
  const supabase = client || createAdminClient();

  try {
    // 1. Fetch active base tokens (optionally filtered by tokenId)
    let tokensQuery = supabase
      .from('base_tokens')
      .select('id, symbol')
      .eq('is_active', true);

    if (tokenId !== undefined) {
      tokensQuery = tokensQuery.eq('id', tokenId);
    }

    const { data: baseTokens, error: tokensError } = await tokensQuery;

    if (tokensError) {
      console.error('[ensureUserBalances] Error fetching base tokens:', tokensError);
      return {
        success: false,
        created: 0,
        skipped: 0,
        total: 0,
        error: 'Failed to fetch base tokens',
        details: tokensError,
      };
    }

    if (!baseTokens || baseTokens.length === 0) {
      return { success: true, created: 0, skipped: 0, total: 0 };
    }

    // 2. Fetch existing balances for this user (optionally filtered by tokenId)
    let existingQuery = supabase
      .from('user_balances')
      .select('base_token_id')
      .eq('user_id', userId);

    if (tokenId !== undefined) {
      existingQuery = existingQuery.eq('base_token_id', tokenId);
    }

    const { data: existingBalances, error: balancesError } = await existingQuery;

    if (balancesError) {
      console.error('[ensureUserBalances] Error fetching existing balances:', balancesError);
      return {
        success: false,
        created: 0,
        skipped: 0,
        total: baseTokens.length,
        error: 'Failed to fetch existing balances',
        details: balancesError,
      };
    }

    // 3. Find missing tokens
    const existingTokenIds = new Set(
      (existingBalances || []).map((b) => b.base_token_id)
    );
    const missingTokens = baseTokens.filter((t) => !existingTokenIds.has(t.id));
    const skipped = existingBalances?.length || 0;

    if (missingTokens.length === 0) {
      return {
        success: true,
        created: 0,
        skipped,
        total: baseTokens.length,
      };
    }

    // 4. Create missing balances using UPSERT
    const balancesToInsert = missingTokens.map((token) => ({
      user_id: userId,
      base_token_id: token.id,
      balance: 0,
      locked_balance: 0,
    }));

    const { data: insertedRecords, error: insertError } = await supabase
      .from('user_balances')
      .upsert(balancesToInsert, {
        onConflict: 'user_id,base_token_id',
        ignoreDuplicates: true,
      })
      .select('id');

    if (insertError) {
      console.error('[ensureUserBalances] Error creating balance records:', insertError);
      return {
        success: false,
        created: 0,
        skipped,
        total: baseTokens.length,
        error: 'Failed to create balance records',
        details: insertError,
      };
    }

    const created = insertedRecords?.length || 0;

    console.log(
      `[ensureUserBalances] User ${userId}: created ${created}, skipped ${skipped}, total ${baseTokens.length}`
    );

    return {
      success: true,
      created,
      skipped,
      total: baseTokens.length,
    };
  } catch (error) {
    console.error('[ensureUserBalances] Unexpected error:', error);
    return {
      success: false,
      created: 0,
      skipped: 0,
      total: 0,
      error: 'Unexpected error occurred',
      details: error,
    };
  }
}

/**
 * KYC Utility Functions
 * Helper functions for KYC checks and transaction limit enforcement
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type KYCTier = 'none' | 'tier_1_basic' | 'tier_2_advanced' | 'tier_3_enhanced';
export type KYCStatus = 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';

interface KYCLimits {
  tier: KYCTier;
  daily_limit_usd: number;
  monthly_limit_usd: number;
  single_transaction_limit_usd: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  can_swap: boolean;
  can_send: boolean;
  can_earn: boolean;
  can_copy_trade: boolean;
}

interface TransactionCheckResult {
  allowed: boolean;
  reason?: string;
  remaining_limit?: number;
  tier?: KYCTier;
}

/**
 * Get user's KYC status and tier
 */
export async function getUserKYCStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ status: KYCStatus; tier: KYCTier | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_tier')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Failed to fetch KYC status');
  }

  return {
    status: (data.kyc_status as KYCStatus) || 'not_started',
    tier: (data.kyc_tier as KYCTier) || null,
  };
}

/**
 * Get transaction limits for a specific tier
 */
export async function getTransactionLimits(
  supabase: SupabaseClient,
  tier: KYCTier
): Promise<KYCLimits | null> {
  const { data, error } = await supabase
    .from('kyc_transaction_limits')
    .select('*')
    .eq('tier', tier)
    .single();

  if (error || !data) {
    return null;
  }

  return data as KYCLimits;
}

/**
 * Get user's daily transaction total
 */
export async function getDailyTransactionTotal(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_transaction_totals')
    .select('daily_total_usd')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error || !data) {
    return 0; // No transactions today
  }

  return data.daily_total_usd || 0;
}

/**
 * Update user's daily transaction total
 */
export async function updateDailyTransactionTotal(
  supabase: SupabaseClient,
  userId: string,
  amountUsd: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Try to update existing record
  const { data: existing } = await supabase
    .from('user_transaction_totals')
    .select('id, daily_total_usd')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('user_transaction_totals')
      .update({
        daily_total_usd: existing.daily_total_usd + amountUsd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Insert new
    await supabase
      .from('user_transaction_totals')
      .insert({
        user_id: userId,
        date: today,
        daily_total_usd: amountUsd,
      });
  }
}

/**
 * Check if user can perform an action (feature access)
 */
export async function canUserPerformAction(
  supabase: SupabaseClient,
  userId: string,
  action: 'deposit' | 'withdraw' | 'swap' | 'send' | 'earn' | 'copy_trade'
): Promise<TransactionCheckResult> {
  // Get user's KYC status
  const { status, tier } = await getUserKYCStatus(supabase, userId);

  // Check if KYC is approved
  if (status !== 'approved') {
    return {
      allowed: false,
      reason: 'KYC verification required. Please complete identity verification.',
    };
  }

  // Get limits for user's tier
  const limits = await getTransactionLimits(supabase, tier || 'none');

  if (!limits) {
    return {
      allowed: false,
      reason: 'Unable to determine transaction limits',
    };
  }

  // Check feature permission
  const actionKey = `can_${action}` as keyof KYCLimits;
  const canPerform = limits[actionKey];

  if (!canPerform) {
    return {
      allowed: false,
      reason: `This feature requires a higher KYC tier. Current tier: ${tier}`,
      tier: tier || 'none',
    };
  }

  return {
    allowed: true,
    tier: tier || 'none',
  };
}

/**
 * Check if user can perform a transaction with a specific amount
 */
export async function canUserTransact(
  supabase: SupabaseClient,
  userId: string,
  amountUsd: number,
  action: 'deposit' | 'withdraw' | 'swap' | 'send' | 'earn' | 'copy_trade'
): Promise<TransactionCheckResult> {
  // First check if user has access to this action
  const actionCheck = await canUserPerformAction(supabase, userId, action);
  if (!actionCheck.allowed) {
    return actionCheck;
  }

  // Get user's tier and limits
  const { tier } = await getUserKYCStatus(supabase, userId);
  const limits = await getTransactionLimits(supabase, tier || 'none');

  if (!limits) {
    return {
      allowed: false,
      reason: 'Unable to determine transaction limits',
    };
  }

  // Check single transaction limit
  if (amountUsd > limits.single_transaction_limit_usd) {
    return {
      allowed: false,
      reason: `Transaction exceeds single transaction limit of $${limits.single_transaction_limit_usd.toLocaleString()}`,
      tier: tier || 'none',
    };
  }

  // Check daily limit
  const dailyTotal = await getDailyTransactionTotal(supabase, userId);
  const newDailyTotal = dailyTotal + amountUsd;

  if (newDailyTotal > limits.daily_limit_usd) {
    const remaining = Math.max(limits.daily_limit_usd - dailyTotal, 0);
    return {
      allowed: false,
      reason: `Transaction would exceed daily limit of $${limits.daily_limit_usd.toLocaleString()}. Remaining: $${remaining.toLocaleString()}`,
      remaining_limit: remaining,
      tier: tier || 'none',
    };
  }

  return {
    allowed: true,
    remaining_limit: limits.daily_limit_usd - newDailyTotal,
    tier: tier || 'none',
  };
}

/**
 * Record a completed transaction (updates daily total)
 */
export async function recordTransaction(
  supabase: SupabaseClient,
  userId: string,
  amountUsd: number
): Promise<void> {
  await updateDailyTransactionTotal(supabase, userId, amountUsd);
}

/**
 * Require KYC approval (throws error if not approved)
 */
export async function requireKYCApproval(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { status } = await getUserKYCStatus(supabase, userId);

  if (status !== 'approved') {
    throw new Error('KYC verification required');
  }
}

/**
 * Require specific KYC tier (throws error if tier not met)
 */
export async function requireKYCTier(
  supabase: SupabaseClient,
  userId: string,
  requiredTier: KYCTier
): Promise<void> {
  const { status, tier } = await getUserKYCStatus(supabase, userId);

  if (status !== 'approved') {
    throw new Error('KYC verification required');
  }

  const tierHierarchy: KYCTier[] = ['none', 'tier_1_basic', 'tier_2_advanced', 'tier_3_enhanced'];
  const userTierIndex = tierHierarchy.indexOf(tier || 'none');
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    throw new Error(`This feature requires ${requiredTier} KYC tier`);
  }
}

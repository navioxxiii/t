/**
 * Rate Limiting for Admin Actions
 * In-memory rate limiting with Redis fallback support
 */

import { createClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store (use Redis in production for multi-instance support)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if user exceeded rate limit
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `${userId}:${action}`;
  const now = Date.now();

  // Get current limit data
  let limitData = rateLimitStore.get(key);

  // Reset if window expired
  if (!limitData || now >= limitData.resetAt) {
    limitData = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  limitData.count++;
  rateLimitStore.set(key, limitData);

  // Check if exceeded
  if (limitData.count > config.maxRequests) {
    const retryAfter = Math.ceil((limitData.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Log rate limit event to database
 */
export async function logRateLimitEvent(params: {
  userId: string;
  action: string;
  allowed: boolean;
  ipAddress?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('admin_action_logs').insert({
      admin_id: params.userId,
      action: params.action,
      status: params.allowed ? 'allowed' : 'rate_limited',
      ip_address: params.ipAddress,
      metadata: { rate_limit_exceeded: !params.allowed },
    });
  } catch (error) {
    console.error('Failed to log rate limit event:', error);
  }
}

/**
 * Rate limit configurations by action type
 */
export const RATE_LIMITS = {
  ADMIN_APPROVE: { windowMs: 60000, maxRequests: 20 }, // 20 approvals per minute
  SUPER_ADMIN_APPROVE: { windowMs: 60000, maxRequests: 10 }, // 10 approvals per minute
  REJECT: { windowMs: 60000, maxRequests: 30 }, // 30 rejections per minute
  MARK_SENT_MANUAL: { windowMs: 60000, maxRequests: 10 }, // 10 manual sends per minute
};

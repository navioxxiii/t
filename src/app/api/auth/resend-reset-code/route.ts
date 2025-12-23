/**
 * Resend Password Reset Code
 * Rate-limited endpoint to resend password reset verification code
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification/code-generator';
import { sendPasswordResetEmail } from '@/lib/email/helpers';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (production should use Redis)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Look up user by email
    const { data: { users }, error: lookupError } = await adminClient.auth.admin.listUsers();

    if (lookupError) {
      console.error('[Resend Reset Code] Error looking up user:', lookupError);
      // Don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a new reset code has been sent.',
      });
    }

    const foundUser = users.find(u => u.email === email);

    // If user doesn't exist, return success anyway (security - don't reveal user existence)
    if (!foundUser) {
      console.log('[Resend Reset Code] User not found, returning fake success');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a new reset code has been sent.',
      });
    }

    // Check if email is verified
    if (!foundUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email before resetting your password.' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const lastSent = rateLimitMap.get(foundUser.id);
    const now = Date.now();

    if (lastSent && now - lastSent < RATE_LIMIT_WINDOW) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${remainingSeconds} seconds before requesting a new code` },
        { status: 429 }
      );
    }

    // Generate new verification code
    const code = generateVerificationCode();

    // Store code with password_reset type
    try {
      await storeVerificationCode(foundUser.id, code, 'password_reset');
    } catch (codeError) {
      console.error('[Resend Reset Code] Failed to store verification code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate reset code. Please try again.' },
        { status: 500 }
      );
    }

    // Get user profile for name
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', foundUser.id)
      .single();

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        email: foundUser.email!,
        code,
        recipientName: profile?.full_name || foundUser.email!.split('@')[0],
      });
    } catch (emailError) {
      console.error('[Resend Reset Code] Failed to send reset email:', emailError);
      // Don't fail - code was stored, user can try again
      console.warn('[Resend Reset Code] Code generated but email failed.');
    }

    // Update rate limit map
    rateLimitMap.set(foundUser.id, now);

    // Clean up old entries (optional, prevents memory leak)
    setTimeout(() => {
      rateLimitMap.delete(foundUser.id);
    }, RATE_LIMIT_WINDOW);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a new reset code has been sent.',
    });
  } catch (error) {
    console.error('[Resend Reset Code] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Resend Verification Code
 * Rate-limited endpoint to resend email verification code
 * Supports both authenticated and unauthenticated flows
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification/code-generator';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (production should use Redis)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: providedEmail } = body;

    const supabase = await createClient();
    let user;
    let userId: string;
    let userEmail: string;
    let userName: string;

    // Check if user is authenticated
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // Authenticated flow
      user = authUser;
      userId = user.id;
      userEmail = user.email!;
      userName = user.user_metadata?.full_name || 'User';
    } else if (providedEmail) {
      // Unauthenticated flow - look up user by email
      const adminClient = createAdminClient();
      const { data: { users }, error: lookupError } = await adminClient.auth.admin.listUsers();

      if (lookupError) {
        console.error('[Resend Verification] Error looking up user:', lookupError);
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 500 }
        );
      }

      const foundUser = users.find(u => u.email === providedEmail);

      if (!foundUser) {
        // Don't reveal if user exists or not (security)
        return NextResponse.json(
          { message: 'If an account exists with this email, a verification code has been sent.' },
          { status: 200 }
        );
      }

      userId = foundUser.id;
      userEmail = foundUser.email!;
      userName = foundUser.user_metadata?.full_name || 'User';
      user = foundUser;
    } else {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const lastSent = rateLimitMap.get(userId);
    const now = Date.now();

    if (lastSent && now - lastSent < RATE_LIMIT_WINDOW) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${remainingSeconds} seconds before resending` },
        { status: 429 }
      );
    }

    // Generate new verification code
    const code = generateVerificationCode();
    await storeVerificationCode(userId, code, 'email_verification');

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email/helpers');
    await sendVerificationEmail({
      email: userEmail,
      code,
      recipientName: userName,
    });

    // Update rate limit map
    rateLimitMap.set(userId, now);

    // Clean up old entries (optional, prevents memory leak)
    setTimeout(() => {
      rateLimitMap.delete(userId);
    }, RATE_LIMIT_WINDOW);

    return NextResponse.json(
      { message: 'Verification code sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Resend Verification] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Forgot Password API Endpoint
 * Handles password reset requests by generating and sending a 6-digit code
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification/code-generator';
import { sendPasswordResetEmail } from '@/lib/email/helpers';
import { NextResponse } from 'next/server';

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
      console.error('[Forgot Password] Error looking up user:', lookupError);
      // Return generic success message (don't reveal if email exists)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    const foundUser = users.find(u => u.email === email);

    // If user doesn't exist, return success anyway (security - don't reveal user existence)
    if (!foundUser) {
      console.log('[Forgot Password] User not found, returning fake success');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    // Check if email is verified
    if (!foundUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email before resetting your password.' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = generateVerificationCode();

    // Store code with password_reset type
    try {
      await storeVerificationCode(foundUser.id, code, 'password_reset');
    } catch (codeError) {
      console.error('[Forgot Password] Failed to store verification code:', codeError);
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
      console.error('[Forgot Password] Failed to send reset email:', emailError);
      // Don't fail - user can try resend
      console.warn('[Forgot Password] Code generated but email failed. User can resend.');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error) {
    console.error('[Forgot Password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

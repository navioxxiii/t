/**
 * Registration API Endpoint
 * Handles user registration with verification code generation
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification/code-generator';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Create user with unverified email (admin method)
    const { data, error} = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,  // User must verify with 6-digit code
      user_metadata: {
        full_name: fullName,
        registered_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('[Register API] User creation error:', error);

      // Better error messages for admin.createUser()
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Try logging in instead.' },
          { status: 400 }
        );
      }

      if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      if (error.message.includes('password') && error.message.includes('weak')) {
        return NextResponse.json(
          { error: 'Password is too weak. Use at least 8 characters.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create user account' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate and store verification code
    const code = generateVerificationCode();

    try {
      await storeVerificationCode(data.user.id, code);
    } catch (codeError) {
      console.error('[Register API] Failed to store verification code:', codeError);

      // Rollback: Delete auth user (profile auto-deleted via cascade)
      await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(console.error);

      return NextResponse.json(
        { error: 'Failed to generate verification code. Please try again.' },
        { status: 500 }
      );
    }

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email/helpers');

    try {
      await sendVerificationEmail({
        email,
        code,
        recipientName: fullName,
      });
    } catch (emailError) {
      console.error('[Register API] Failed to send verification email:', emailError);
      // Don't rollback - user can resend via /api/auth/resend-verification
      console.warn('[Register API] User created but email failed. User can resend code.');
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Check your email for verification code.',
      userId: data.user.id,
    });
  } catch (error) {
    console.error('[Register API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

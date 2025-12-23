/**
 * Reset Password API Endpoint
 * Resets user password using verification code
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCode, deleteVerificationCode } from '@/lib/verification/code-generator';
import { sendPasswordChangedEmail } from '@/lib/email/helpers';
import { NextResponse } from 'next/server';

// Password validation regex
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    // Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Please enter a 6-digit code.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return NextResponse.json(
        {
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        },
        { status: 400 }
      );
    }

    if (newPassword.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
      return NextResponse.json(
        { error: 'Password cannot contain your email address' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Look up user by email
    const { data: { users }, error: lookupError } = await adminClient.auth.admin.listUsers();

    if (lookupError) {
      console.error('[Reset Password] Error looking up user:', lookupError);
      return NextResponse.json(
        { error: 'Unable to process request' },
        { status: 500 }
      );
    }

    const foundUser = users.find(u => u.email === email);

    if (!foundUser) {
      return NextResponse.json(
        { error: 'Invalid verification code.' },
        { status: 400 }
      );
    }

    // Verify code with password_reset type
    const result = await verifyCode(foundUser.id, code, 'password_reset');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Update password using admin client
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      foundUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[Reset Password] Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password. Please try again.' },
        { status: 500 }
      );
    }

    // Delete the used reset code
    try {
      await deleteVerificationCode(foundUser.id, 'password_reset');
    } catch (deleteError) {
      console.error('[Reset Password] Failed to delete code:', deleteError);
      // Don't fail - password was already reset
    }

    // Get user profile for name
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', foundUser.id)
      .single();

    // Send password changed confirmation email
    try {
      await sendPasswordChangedEmail({
        email: foundUser.email!,
        recipientName: profile?.full_name || foundUser.email!.split('@')[0],
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('[Reset Password] Failed to send confirmation email:', emailError);
      // Don't fail - password was already reset
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (error) {
    console.error('[Reset Password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

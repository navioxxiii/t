/**
 * PIN Verification API
 * Verifies user's 4-digit PIN for transactions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { pin } = body;

    // Validate PIN format
    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      );
    }

    // Get user's profile with PIN data
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('pin_code_hash, failed_pin_attempts, pin_locked_until')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Check if PIN is set up
    if (!profile.pin_code_hash) {
      return NextResponse.json(
        { error: 'PIN not set up' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (profile.pin_locked_until) {
      const lockUntil = new Date(profile.pin_locked_until);
      const now = new Date();

      if (now < lockUntil) {
        const remainingSeconds = Math.ceil((lockUntil.getTime() - now.getTime()) / 1000);
        return NextResponse.json(
          {
            error: 'Too many failed attempts',
            locked: true,
            remainingSeconds,
          },
          { status: 429 }
        );
      }

      // Lock period expired, reset failed attempts
      await adminClient
        .from('profiles')
        .update({
          failed_pin_attempts: 0,
          pin_locked_until: null,
        })
        .eq('id', user.id);
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, profile.pin_code_hash);

    if (isValid) {
      // Reset failed attempts on successful verification
      await adminClient
        .from('profiles')
        .update({
          failed_pin_attempts: 0,
          pin_locked_until: null,
        })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        verified: true,
      });
    } else {
      // Increment failed attempts
      const newFailedAttempts = (profile.failed_pin_attempts || 0) + 1;
      let pinLockedUntil = null;

      // Lock account after 3 failed attempts for 30 seconds
      if (newFailedAttempts >= 3) {
        pinLockedUntil = new Date(Date.now() + 30 * 1000).toISOString();
        
        // TODO: Send security alert email when PIN is locked
        // Template needed: SecurityAlertEmail (PIN lockout)
        // const { data: userProfile } = await supabase
        //   .from('profiles')
        //   .select('email, full_name')
        //   .eq('id', user.id)
        //   .single();
        // if (userProfile) {
        //   await sendSecurityAlertEmail({
        //     email: userProfile.email,
        //     recipientName: userProfile.full_name || 'User',
        //     alertType: 'pin_lockout',
        //     message: 'Your account has been temporarily locked due to multiple failed PIN attempts.',
        //   });
        // }
      }

      await adminClient
        .from('profiles')
        .update({
          failed_pin_attempts: newFailedAttempts,
          pin_locked_until: pinLockedUntil,
        })
        .eq('id', user.id);

      const attemptsRemaining = Math.max(0, 3 - newFailedAttempts);

      if (pinLockedUntil) {
        return NextResponse.json(
          {
            error: 'Too many failed attempts',
            verified: false,
            locked: true,
            remainingSeconds: 30,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Incorrect PIN',
          verified: false,
          attemptsRemaining,
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

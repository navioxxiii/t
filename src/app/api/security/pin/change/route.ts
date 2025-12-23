/**
 * Change PIN API
 * Allows users to change their 4-digit PIN code with current PIN verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import * as bcrypt from 'bcryptjs';

const RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_DURATION = 30 * 1000; // 30 seconds

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { currentPin, newPin } = await request.json();

    // Validation
    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: 'Current PIN and new PIN are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    if (currentPin === newPin) {
      return NextResponse.json(
        { error: 'New PIN must be different from current PIN' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if PIN is set
    if (!profile.pin_code_hash) {
      return NextResponse.json(
        { error: 'No PIN set. Please set up a PIN first.' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const now = Date.now();
    const lockedUntil = profile.pin_locked_until
      ? new Date(profile.pin_locked_until).getTime()
      : 0;

    if (lockedUntil > now) {
      const remainingSeconds = Math.ceil((lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: 'Too many failed attempts',
          locked: true,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Verify current PIN
    const isValid = await bcrypt.compare(currentPin, profile.pin_code_hash);

    if (!isValid) {
      const failedAttempts = (profile.failed_pin_attempts || 0) + 1;

      // Check if we need to lock the account
      if (failedAttempts >= RATE_LIMIT_ATTEMPTS) {
        const lockUntil = new Date(now + RATE_LIMIT_DURATION);

        await adminClient
          .from('profiles')
          .update({
            failed_pin_attempts: failedAttempts,
            pin_locked_until: lockUntil.toISOString(),
          })
          .eq('id', user.id);

        return NextResponse.json(
          {
            error: 'Too many failed attempts',
            locked: true,
            remainingSeconds: RATE_LIMIT_DURATION / 1000,
          },
          { status: 429 }
        );
      }

      // Increment failed attempts
      await adminClient
        .from('profiles')
        .update({
          failed_pin_attempts: failedAttempts,
        })
        .eq('id', user.id);

      return NextResponse.json(
        {
          error: 'Current PIN is incorrect',
          attemptsRemaining: RATE_LIMIT_ATTEMPTS - failedAttempts,
        },
        { status: 401 }
      );
    }

    // Current PIN is valid, hash new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update PIN and reset failed attempts
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        pin_code_hash: hashedPin,
        last_pin_change_at: new Date().toISOString(),
        failed_pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return NextResponse.json(
        { error: 'Failed to update PIN' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to user about PIN change
    // Template needed: PinChangedEmail
    // const { data: userProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name')
    //   .eq('id', user.id)
    //   .single();
    // if (userProfile) {
    //   await sendPinChangedEmail({
    //     email: userProfile.email,
    //     recipientName: userProfile.full_name || 'User',
    //   });
    // }

    return NextResponse.json({
      success: true,
      message: 'PIN changed successfully',
    });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change PIN' },
      { status: 500 }
    );
  }
}

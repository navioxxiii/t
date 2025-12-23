/**
 * Security Status API
 * Returns user's security setup status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get user's security status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pin_code_hash, webauthn_credentials, security_preferences, last_pin_change_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch security status' },
        { status: 500 }
      );
    }

    const hasPinSetup = !!profile.pin_code_hash;
    const hasDeviceAuth = !!(
      profile.webauthn_credentials &&
      Array.isArray(profile.webauthn_credentials) &&
      profile.webauthn_credentials.length > 0
    );

    const securityPreferences = profile.security_preferences || {
      idle_timeout_minutes: 5,
      device_auth_enabled: false,
      pin_setup_completed: hasPinSetup,
    };

    return NextResponse.json({
      hasPinSetup,
      hasDeviceAuth,
      securityPreferences,
      lastPinChangeAt: profile.last_pin_change_at,
    });
  } catch (error) {
    console.error('Security status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

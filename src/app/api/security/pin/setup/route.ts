/**
 * PIN Setup API
 * Creates or updates user's 4-digit transaction PIN
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

    // Validate PIN
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    // Check PIN format (exactly 4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Hash PIN with bcrypt
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Update profile with hashed PIN
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        pin_code_hash: pinHash,
        last_pin_change_at: new Date().toISOString(),
        security_preferences: {
          idle_timeout_minutes: 5,
          device_auth_enabled: false,
          pin_setup_completed: true,
        },
        failed_pin_attempts: 0,
        pin_locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('PIN setup error:', updateError);
      return NextResponse.json(
        { error: 'Failed to setup PIN' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PIN setup successful',
    });
  } catch (error) {
    console.error('PIN setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

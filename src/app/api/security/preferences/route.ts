/**
 * Security Preferences API
 * Updates user's security settings like idle timeout
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
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
    const { idle_timeout_minutes } = body;

    // Validate idle_timeout_minutes
    if (idle_timeout_minutes !== undefined) {
      const validTimeouts = [0, 1, 5, 10, 15, 30];
      if (!validTimeouts.includes(idle_timeout_minutes)) {
        return NextResponse.json(
          { error: 'Invalid timeout value. Must be 0, 1, 5, 10, 15, or 30 minutes.' },
          { status: 400 }
        );
      }
    }

    // Get current profile to preserve existing preferences
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('security_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Merge new preferences with existing ones
    const currentPrefs = profile?.security_preferences || {
      idle_timeout_minutes: 5,
      device_auth_enabled: false,
      pin_setup_completed: false,
    };

    const updatedPrefs = {
      ...currentPrefs,
      ...(idle_timeout_minutes !== undefined && { idle_timeout_minutes }),
    };

    // Update profile with new preferences
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        security_preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      security_preferences: updatedPrefs,
    });
  } catch (error) {
    console.error('Security preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const adminClient = createAdminClient();

    // Get profile with security preferences
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('security_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    const prefs = profile?.security_preferences || {
      idle_timeout_minutes: 5,
      device_auth_enabled: false,
      pin_setup_completed: false,
    };

    return NextResponse.json({
      security_preferences: prefs,
    });
  } catch (error) {
    console.error('Security preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

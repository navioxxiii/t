/**
 * Display Preferences API Endpoint
 * Manages user display preferences for coin list filtering
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DisplayPreferences {
  show_non_zero_only: boolean;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  show_non_zero_only: false,
};

/**
 * GET - Fetch user's display preferences
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch display preferences from database
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('display_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch display preferences:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch display preferences' },
        { status: 500 }
      );
    }

    // Return preferences from database, or defaults if null
    const preferences = profile.display_preferences || DEFAULT_PREFERENCES;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Display preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user's display preferences
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const preferences = body.preferences as Partial<DisplayPreferences>;

    // Validate preferences
    const validKeys: Array<keyof DisplayPreferences> = ['show_non_zero_only'];

    for (const key of Object.keys(preferences)) {
      if (!validKeys.includes(key as keyof DisplayPreferences)) {
        return NextResponse.json(
          { error: `Invalid preference key: ${key}` },
          { status: 400 }
        );
      }

      if (typeof preferences[key as keyof DisplayPreferences] !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Fetch current preferences
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('display_preferences')
      .eq('id', user.id)
      .single();

    // Merge with existing preferences
    const updatedPreferences = {
      ...(currentProfile?.display_preferences || DEFAULT_PREFERENCES),
      ...preferences,
    };

    // Save to database
    const { data: profile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        display_preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('display_preferences')
      .single();

    if (updateError) {
      console.error('Failed to update display preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update display preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: profile.display_preferences,
    });
  } catch (error) {
    console.error('Display preferences update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

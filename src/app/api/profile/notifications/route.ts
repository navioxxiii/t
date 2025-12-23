import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface NotificationSettings {
  email_deposits: boolean;
  email_withdrawals: boolean;
  email_swaps: boolean;
  email_security: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_deposits: true,
  email_withdrawals: true,
  email_swaps: true,
  email_security: true,
};

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

    // Fetch notification preferences from database
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch notification preferences:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      );
    }

    // Return preferences from database, or defaults if null
    const settings = profile.notification_preferences || DEFAULT_SETTINGS;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const settings = body.settings as Partial<NotificationSettings>;

    // Validate settings
    const validKeys: Array<keyof NotificationSettings> = [
      'email_deposits',
      'email_withdrawals',
      'email_swaps',
      'email_security',
    ];

    for (const key of Object.keys(settings)) {
      if (!validKeys.includes(key as keyof NotificationSettings)) {
        return NextResponse.json(
          { error: `Invalid setting key: ${key}` },
          { status: 400 }
        );
      }

      if (typeof settings[key as keyof NotificationSettings] !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    // Fetch current preferences
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    // Merge with existing preferences
    const updatedSettings = {
      ...(currentProfile?.notification_preferences || DEFAULT_SETTINGS),
      ...settings,
    };

    // Save to database
    const { data: profile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        notification_preferences: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('notification_preferences')
      .single();

    if (updateError) {
      console.error('Failed to update notification preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: profile.notification_preferences,
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role, notification_preferences, created_at, last_login_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
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
    const { full_name } = body;

    // Validate input
    if (full_name !== undefined) {
      if (typeof full_name !== 'string') {
        return NextResponse.json(
          { error: 'Invalid full_name format' },
          { status: 400 }
        );
      }

      if (full_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Full name cannot be empty' },
          { status: 400 }
        );
      }

      if (full_name.length > 100) {
        return NextResponse.json(
          { error: 'Full name is too long (max 100 characters)' },
          { status: 400 }
        );
      }
    }

    // Update profile
    const { data: profile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name: full_name?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

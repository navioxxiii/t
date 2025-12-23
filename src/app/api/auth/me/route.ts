/**
 * Get Current User Profile
 * Debug endpoint to check user authentication and role
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', user: null, profile: null },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: 'Profile not found',
          errorDetails: profileError,
          user: {
            id: user.id,
            email: user.email,
          },
          profile: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      isAdmin: ['admin', 'super_admin'].includes(profile?.role),
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get user profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

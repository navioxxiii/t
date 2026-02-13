/**
 * Admin Create User API
 * POST /api/admin/data-management/create-user
 * Manually create a new user with custom registration date
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storePasswordAudit } from "@/lib/security/password-audit";
import { ensureUserBalances } from "@/lib/users/balances";

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // ← regular client (session + RLS)
  const supabaseAdmin = createAdminClient(); // ← service_role (dangerous!)

  try {
    // 1. Get current user from session (safe, uses cookie)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check if this user is actually an admin (respects RLS → safe)
    const { data: profile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (
      userProfileError ||
      !profile ||
      !["admin", "super_admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // → At this point: we KNOW the caller is a real admin via secure session

    // 3. Parse body
    const body = await request.json();
    const { email, full_name, role = "user", created_at, password, email_verified = true } = body;

    if (!email || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!["user", "admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if trying to create super_admin (only super_admins can do this)
    if (role === "super_admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create super admin accounts" },
        { status: 403 }
      );
    }

    // Validate password
    const finalPassword = password || "Temp@2025!";
    if (finalPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const finalCreatedAt = created_at ? new Date(created_at) : new Date();

    // 4. Create auth user - Supabase will handle duplicate email detection
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: email_verified,
      user_metadata: {
        full_name: full_name || email.split('@')[0],
        registered_at: finalCreatedAt.toISOString(),
        created_by_admin: user.id,
      },
    });

    if (createError || !newUserData?.user) {
      // Check if it's a duplicate email error
      if (createError?.message?.includes('already registered') ||
          createError?.message?.includes('duplicate') ||
          createError?.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: createError?.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    const newUserId = newUserData.user.id;

    // ⚠️ AUDIT: Store temporary password for compliance (encrypted)
    try {
      await storePasswordAudit({
        userId: newUserId,
        password: finalPassword,
        method: 'admin_creation',
        setByUserId: user.id, // Admin who created the user
      });
    } catch (error) {
      console.error('[Admin Create User] Password audit storage failed:', error);
      // Don't fail user creation if audit fails
    }

    // 5. Wait for trigger to create profile, then update with admin values
    // The on_auth_user_created trigger automatically creates:
    // - profiles (with default role='user')
    // - user_token_preferences
    // - user_balances
    // We just need to update the profile with our custom values

    // Brief delay to ensure trigger completes (usually instant, but being safe)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile was created by trigger
    const { data: triggerProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', newUserId)
      .single();

    if (fetchError || !triggerProfile) {
      console.error('Profile was not created by trigger:', fetchError);

      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(console.error);

      return NextResponse.json(
        {
          error: 'Database trigger failed to create profile. Check trigger configuration.',
          details: fetchError?.message
        },
        { status: 500 }
      );
    }

    // Update profile with admin-specified values (role, created_at, full_name)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email, // Ensure email is set
        full_name: full_name || null,
        role, // Override default 'user' role
        is_banned: false,
        created_at: finalCreatedAt.toISOString(), // Custom registration date
        updated_at: finalCreatedAt.toISOString(),
      })
      .eq('id', newUserId);

    if (profileUpdateError) {
      console.error('Failed to update profile with admin values:', profileUpdateError);

      // Rollback: delete profile and auth user
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(console.error);

      return NextResponse.json(
        { error: 'Failed to update profile', details: profileUpdateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Profile created by trigger and updated with admin values:', {
      userId: newUserId,
      role,
      created_at: finalCreatedAt.toISOString(),
    });

    // Ensure user_balances were created by trigger (with fallback)
    const balanceResult = await ensureUserBalances(newUserId, { client: supabaseAdmin });

    if (!balanceResult.success) {
      console.error('Failed to ensure user balances:', balanceResult.error);

      // Rollback
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(console.error);

      return NextResponse.json(
        { error: 'Failed to initialize user balances', details: balanceResult.error },
        { status: 500 }
      );
    }

    if (balanceResult.total === 0) {
      // No active tokens found - this is unusual but not fatal
      console.warn('No active base tokens found for user initialization');
    }

    console.log('✅ User balances verified:', {
      userId: newUserId,
      created: balanceResult.created,
      skipped: balanceResult.skipped,
      total: balanceResult.total,
    });

    // Verify user_token_preferences were created by trigger
    const { data: tokenPrefs, error: prefsCheckError } = await supabaseAdmin
      .from('user_token_preferences')
      .select('base_token_id, is_visible')
      .eq('user_id', newUserId);

    if (prefsCheckError) {
      console.warn('Failed to verify user_token_preferences:', prefsCheckError);
      // Don't fail - preferences are not critical
    }

    console.log('✅ User token preferences verified (created by trigger):', {
      userId: newUserId,
      prefsCount: tokenPrefs?.length || 0,
    });

    // Log admin action
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: user.id,
      admin_email: profile.email,
      action_type: 'create_user',
      target_user_id: newUserId,
      target_user_email: email,
      details: {
        full_name,
        role,
        created_at: finalCreatedAt.toISOString(),
        temp_password_provided: true,
      },
      created_at: new Date().toISOString(),
    });

    // TODO: Send welcome email to newly created user with temporary password
    // Template needed: AdminCreatedUserWelcomeEmail
    // await sendAdminCreatedUserWelcomeEmail({
    //   email,
    //   recipientName: full_name || email.split('@')[0],
    //   tempPassword: password,
    //   loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    //   changePasswordUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/security`,
    // });

    // Success!
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUserId,
        email,
        full_name,
        role,
        created_at: finalCreatedAt,
        temp_password: finalPassword, // send to admin only
      },
    });
  } catch (err: unknown) {
    console.error("Admin create-user API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

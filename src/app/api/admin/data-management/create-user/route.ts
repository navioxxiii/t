/**
 * Admin Create User API
 * POST /api/admin/data-management/create-user
 * Manually create a new user with custom registration date
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Default tokens to create balances for new users
const DEFAULT_TOKEN_SYMBOLS = ["BTC", "ETH", "USDT", "TRX", "LTC", "SOL"];

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
      .select("role")
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
    const { email, full_name, role = "user", created_at } = body;

    if (!email || !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!["user", "admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const password = "Temp@2025!"; // Temporary password for new user
    const finalCreatedAt = created_at ? new Date(created_at) : new Date();

    // 4. NOW use admin client to create user (only admins reach here)
    // Inside your POST handler, right after creating the auth user
const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: full_name || email.split('@')[0],
    registered_at: finalCreatedAt.toISOString(),
    created_by_admin: user.id,
  },
});

if (createError || !newUserData?.user) {
  return NextResponse.json(
    { error: createError?.message || 'Failed to create auth user' },
    { status: 500 }
  );
}

const newUserId = newUserData.user.id;

console.log('Request body:', body);
console.log('Email:', email);
console.log('New user ID from Supabase:', newUserData.user.id);
console.log('ID being inserted into profiles:', newUserId);
// CHECK IF PROFILE ALREADY EXISTS (this saves you every time)
const { data: existingProfile } = await supabaseAdmin
  .from('profiles')
  .select('id')
  .eq('id', newUserId)
  .maybeSingle();

if (existingProfile) {
  console.warn('Profile already exists for user ID:', existingProfile);
  // Profile already exists → user was half-created before → clean up and fail gracefully
  // await supabaseAdmin.auth.admin.deleteUser(newUserId);
  return NextResponse.json(
    { error: 'User already exists or was partially created. Cleaned up.' },
    { status: 409 }
  );
}

// NOW safe to insert profile
const { error: profileError } = await supabaseAdmin.from('profiles').insert({
  id: newUserId,
  email,
  full_name: full_name || null,
  role,
  is_banned: false,
  created_at: finalCreatedAt.toISOString(),
  updated_at: finalCreatedAt.toISOString(),
});

if (profileError) {
  console.error('Profile creation failed:', profileError);

  // ALWAYS rollback the auth user if profile fails
  await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(console.error);

  return NextResponse.json(
    { error: 'Failed to create profile', details: profileError.message },
    { status: 500 }
  );
}

    // Create user balances for default tokens
    const { data: baseTokens, error: tokensError } = await supabaseAdmin
      .from('base_tokens')
      .select('id, symbol')
      // .in('symbol', DEFAULT_TOKEN_SYMBOLS)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching base tokens:', tokensError);
      // Continue anyway - balances can be created later
    } else if (baseTokens && baseTokens.length > 0) {
      const balanceInserts = baseTokens.map((token) => ({
        user_id: newUserId,
        base_token_id: token.id,
        balance: 0,
        locked_balance: 0,
      }));

      const { error: balancesError } = await supabaseAdmin
        .from('user_balances')
        .insert(balanceInserts);

      if (balancesError) {
        console.error('User balance creation failed:', balancesError);

        // ALWAYS rollback the auth user and profile if balances fail
        try {
          await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }

        return NextResponse.json(
          { error: 'Failed to create user balances', details: balancesError.message },
          { status: 500 }
        );
      }
    }

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
        temp_password: password, // send to admin only
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

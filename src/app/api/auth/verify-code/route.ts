/**
 * Verify Code API Endpoint
 * Validates 6-digit verification code
 * Supports both authenticated and unauthenticated flows
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCode } from '@/lib/verification/code-generator';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/helpers';

// Default tokens to create balances for new users
const DEFAULT_TOKEN_SYMBOLS = ["BTC", "ETH", "USDT", "TRX", "LTC", "SOL"];

export async function POST(request: Request) {
  try {
    const { code, email: providedEmail } = await request.json();

    // Validate input
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Please enter a 6-digit code.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let user;
    let userId: string;

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // Authenticated flow
      user = authUser;
      userId = user.id;
    } else if (providedEmail) {
      // Unauthenticated flow - look up user by email
      const adminClient = createAdminClient();
      const { data: { users }, error: lookupError } = await adminClient.auth.admin.listUsers();

      if (lookupError) {
        console.error('[Verify Code] Error looking up user:', lookupError);
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 500 }
        );
      }

      const foundUser = users.find(u => u.email === providedEmail);

      if (!foundUser) {
        return NextResponse.json(
          { error: 'Invalid verification code.' },
          { status: 400 }
        );
      }

      userId = foundUser.id;
      user = foundUser;
    } else {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email already verified.' },
        { status: 400 }
      );
    }

    // Verify the code
    const result = await verifyCode(userId, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Mark email as verified using Supabase Admin API
    // Uses admin client with service role key (server-side only)
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('[Verify Code] Error confirming email:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      );
    }

    // CREATE DEFAULT USER BALANCES after email verification
    console.log('[Verify Code] Creating default user balances for user:', userId);

    // Get base token IDs for default tokens
    const { data: baseTokens, error: tokensError } = await adminClient
      .from('base_tokens')
      .select('id, symbol')
      .in('symbol', DEFAULT_TOKEN_SYMBOLS)
      .eq('is_active', true);

    if (tokensError) {
      console.error('[Verify Code] Error fetching base tokens:', tokensError);
    } else if (baseTokens && baseTokens.length > 0) {
      const balanceInserts = baseTokens.map((token) => ({
        user_id: userId,
        base_token_id: token.id,
        balance: 0,
        locked_balance: 0,
      }));

      const { error: balancesError } = await adminClient
        .from('user_balances')
        .insert(balanceInserts);

      if (balancesError) {
        console.error('[Verify Code] User balance creation failed:', balancesError);
        // Don't block verification - balances can be created later
      }
    }

    // Send welcome email after successful verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (user.email && profile) {
      try {
        await sendWelcomeEmail({
          email: user.email,
          recipientName: profile.full_name || user.email.split('@')[0],
        });
      } catch (emailError) {
        console.error('[Verify Code] Failed to send welcome email:', emailError);
        // Do NOT return an error — continue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('[Verify Code] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

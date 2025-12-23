/**
 * WebAuthn Authentication API
 * Handles device authentication for app unlock (Face ID, Touch ID, Windows Hello, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type {
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

/**
 * POST /api/security/webauthn/authenticate
 * Authenticate using device biometrics/passkey
 */
export async function POST(request: NextRequest) {
  try {
    // Dynamically determine RP ID and origin from request headers
    // This allows the app to work on both localhost and ngrok
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;
    const rpID = host.split(':')[0]; // Remove port if present

    console.log('[WebAuthn Authenticate] RP ID:', rpID, 'Origin:', origin);

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const { action, credential } = body;

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if device auth is enabled
    if (!profile.security_preferences?.device_auth_enabled) {
      return NextResponse.json(
        { error: 'Device authentication not enabled' },
        { status: 400 }
      );
    }

    // Get stored credentials
    interface StoredCredential {
      id: string;
      publicKey: string;
      counter: number;
      transports?: string[];
    }
    const storedCredentials = (profile.webauthn_credentials as StoredCredential[]) || [];

    if (storedCredentials.length === 0) {
      return NextResponse.json(
        { error: 'No device credentials registered' },
        { status: 400 }
      );
    }

    // Action: start - Generate authentication options
    if (action === 'start') {
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: storedCredentials.map((cred) => ({
          id: cred.id,
          transports: cred.transports as AuthenticatorTransportFuture[],
        })),
        userVerification: 'required',
      });

      return NextResponse.json({
        options,
        challenge: options.challenge,
      });
    }

    // Action: verify - Verify authentication response
    if (action === 'verify') {
      if (!credential) {
        return NextResponse.json({ error: 'Credential required' }, { status: 400 });
      }

      const { challenge, response } = credential as {
        challenge: string;
        response: AuthenticationResponseJSON;
      };

      // Find the matching credential
      const credentialID = response.id;
      const storedCredential = storedCredentials.find(
        (cred) => cred.id === credentialID
      );

      if (!storedCredential) {
        return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
      }

      // Verify the authentication
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: storedCredential.id,
          publicKey: Buffer.from(storedCredential.publicKey, 'base64'),
          counter: storedCredential.counter || 0,
        },
        requireUserVerification: true,
      });

      if (!verification.verified) {
        return NextResponse.json(
          { error: 'Authentication verification failed' },
          { status: 400 }
        );
      }

      // Update counter for replay attack prevention
      const updatedCredentials = storedCredentials.map((cred) =>
        cred.id === credentialID
          ? { ...cred, counter: verification.authenticationInfo.newCounter }
          : cred
      );

      await adminClient
        .from('profiles')
        .update({
          webauthn_credentials: updatedCredentials,
        })
        .eq('id', user.id);

      return NextResponse.json({
        verified: true,
        message: 'Authentication successful',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 }
    );
  }
}

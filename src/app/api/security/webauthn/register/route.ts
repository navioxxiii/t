/**
 * WebAuthn Registration API
 * Handles device authentication enrollment (Face ID, Touch ID, Windows Hello, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  RegistrationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { branding } from '@/config/branding';

// WebAuthn configuration
const rpName = branding.name.full;

/**
 * POST /api/security/webauthn/register
 * Start device authentication registration
 */
export async function POST(request: NextRequest) {
  try {
    // Dynamically determine RP ID and origin from request headers
    // This allows the app to work on both localhost and ngrok
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;
    const rpID = host.split(':')[0]; // Remove port if present

    console.log('[WebAuthn Register] RP ID:', rpID, 'Origin:', origin);

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

    // Action: start - Generate registration options
    if (action === 'start') {
      // Get existing credentials
      interface StoredCredential {
        id: string;
        publicKey: string;
        counter: number;
        transports?: string[];
      }
      const existingCredentials = (profile.webauthn_credentials as StoredCredential[]) || [];

      // Convert user ID string to Uint8Array (required in v13+)
      const userIDBuffer = new TextEncoder().encode(user.id);

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: userIDBuffer,
        userName: profile.email,
        userDisplayName: profile.full_name || profile.email,
        attestationType: 'none',
        excludeCredentials: existingCredentials.map((cred) => ({
          id: cred.id,
          transports: cred.transports as AuthenticatorTransportFuture[],
        })),
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          residentKey: 'preferred',
          userVerification: 'required',
        },
      } as GenerateRegistrationOptionsOpts);

      // Store challenge in session for verification
      // In production, use a proper session store
      // For now, we'll return it to be sent back
      return NextResponse.json({
        options,
        challenge: options.challenge,
      });
    }

    // Action: verify - Verify registration response
    if (action === 'verify') {
      if (!credential) {
        return NextResponse.json({ error: 'Credential required' }, { status: 400 });
      }

      const { challenge, response } = credential as {
        challenge: string;
        response: RegistrationResponseJSON;
      };

      // Verify the registration
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      } as VerifyRegistrationResponseOpts);

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: 'Registration verification failed' },
          { status: 400 }
        );
      }

      // Store the credential (v13 structure changed)
      const { credential: registeredCredential } = verification.registrationInfo;

      interface StoredCredential {
        id: string;
        publicKey: string;
        counter: number;
        createdAt: string;
        transports?: string[];
      }
      const existingCredentials = (profile.webauthn_credentials as StoredCredential[]) || [];

      const newCredential = {
        id: registeredCredential.id,
        publicKey: Buffer.from(registeredCredential.publicKey).toString('base64'),
        counter: registeredCredential.counter,
        createdAt: new Date().toISOString(),
        transports: response.response.transports || [],
      };

      const updatedCredentials = [...existingCredentials, newCredential];

      // Update profile with new credential
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          webauthn_credentials: updatedCredentials,
          security_preferences: {
            ...profile.security_preferences,
            device_auth_enabled: true,
          },
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating credentials:', updateError);
        return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 });
      }

      return NextResponse.json({
        verified: true,
        message: 'Device authentication registered successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}

/**
 * WebAuthn Hook
 * Client-side WebAuthn operations for device authentication
 */

'use client';

import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';

interface WebAuthnError {
  message: string;
  code?: string;
}

/**
 * Check if WebAuthn is available in the browser
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
}

/**
 * Hook for WebAuthn operations
 */
export function useWebAuthn() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<WebAuthnError | null>(null);

  /**
   * Register a new device credential
   */
  const register = async (): Promise<boolean> => {
    setIsRegistering(true);
    setError(null);

    try {
      // Check if WebAuthn is available
      if (!isWebAuthnAvailable()) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Check if platform authenticator is available
      const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
      if (!isPlatformAvailable) {
        throw new Error(
          'No biometric authenticator found. Please ensure your device supports Face ID, Touch ID, or Windows Hello.'
        );
      }

      // Start registration - get options from server
      const startResponse = await fetch('/api/security/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!startResponse.ok) {
        const data = await startResponse.json();
        throw new Error(data.error || 'Failed to start registration');
      }

      const { options, challenge } = await startResponse.json();

      // Prompt user for biometric authentication
      let attResp: RegistrationResponseJSON;
      try {
        attResp = await startRegistration(options);
      } catch (err) {
        // Handle user cancellation or errors
        const error = err as Error & { name?: string };
        if (error.name === 'NotAllowedError') {
          throw new Error('Registration cancelled by user');
        }
        throw new Error(error.message || 'Registration failed');
      }

      // Verify registration with server
      const verifyResponse = await fetch('/api/security/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          credential: {
            challenge,
            response: attResp,
          },
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Failed to verify registration');
      }

      return true;
    } catch (err) {
      const e = err as Error & { name?: string };
      const error: WebAuthnError = {
        message: e.message || 'Registration failed',
        code: e.name,
      };
      setError(error);
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Authenticate using device credential
   */
  const authenticate = async (): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Check if WebAuthn is available
      if (!isWebAuthnAvailable()) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Start authentication - get options from server
      const startResponse = await fetch('/api/security/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!startResponse.ok) {
        const data = await startResponse.json();
        throw new Error(data.error || 'Failed to start authentication');
      }

      const { options, challenge } = await startResponse.json();

      // Prompt user for biometric authentication
      let asseResp: AuthenticationResponseJSON;
      try {
        asseResp = await startAuthentication(options);
      } catch (err) {
        // Handle user cancellation or errors
        const error = err as Error & { name?: string };
        if (error.name === 'NotAllowedError') {
          throw new Error('Authentication cancelled by user');
        }
        throw new Error(error.message || 'Authentication failed');
      }

      // Verify authentication with server
      const verifyResponse = await fetch('/api/security/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          credential: {
            challenge,
            response: asseResp,
          },
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Failed to verify authentication');
      }

      return true;
    } catch (err) {
      const e = err as Error & { name?: string };
      const error: WebAuthnError = {
        message: e.message || 'Authentication failed',
        code: e.name,
      };
      setError(error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    register,
    authenticate,
    isRegistering,
    isAuthenticating,
    error,
    isAvailable: isWebAuthnAvailable(),
  };
}

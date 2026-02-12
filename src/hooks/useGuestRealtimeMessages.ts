/**
 * useGuestRealtimeMessages Hook
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This hook has been disabled. Original implementation preserved in git history.
 */

'use client';

export function useGuestRealtimeMessages(_token: string) {
  return {
    ticket: null,
    messages: [],
    loading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This hook provided real-time message updates for guest ticket views using
 * token-based authentication and Supabase Realtime subscriptions.
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

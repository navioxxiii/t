/**
 * useUserRealtimeMessages Hook
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This hook has been disabled. Original implementation preserved in git history.
 */

'use client';

export function useUserRealtimeMessages(_ticketId: string) {
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
 * This hook provided real-time message updates for user ticket views using
 * Supabase Realtime subscriptions, replacing 10-second polling with instant
 * updates. Features included:
 * - Real-time message subscription
 * - Auto-scroll to new messages
 * - Read status tracking
 * - Error handling and reconnection
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

/**
 * useAdminRealtimeMessages Hook
 * ⚠️ TICKETING SYSTEM MIGRATED TO TAWK.TO
 * This hook has been disabled. Original implementation preserved in git history.
 */

'use client';

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'admin' | 'guest' | 'system';
  sender_email: string | null;
  message: string;
  created_at: string;
  is_internal_note: boolean;
  read_by_user: boolean;
  read_by_admin: boolean;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

export function useAdminRealtimeMessages(_ticketId: string) {
  return {
    messages: [] as Message[],
    refetch: () => Promise.resolve(),
  };
}

/* ============================================================================
 * ORIGINAL IMPLEMENTATION (COMMENTED OUT - MIGRATED TO TAWK.TO)
 * ============================================================================
 *
 * This hook provided real-time message updates for admin ticket views using
 * Supabase Realtime subscriptions. Features included:
 * - Real-time message subscription for both public and internal notes
 * - Automatic message fetching with sender details
 * - Channel cleanup on unmount
 *
 * See git history to restore the full implementation.
 *
 * ============================================================================ */

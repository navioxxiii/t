/**
 * TanStack Query Hooks for Admin Operations
 * Provides hooks for admin panel functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseAdminError, getErrorToastVariant } from '@/lib/admin/error-parser';

// Re-export error utilities for components
export { parseAdminError, getErrorToastVariant };

// Types
export interface PendingSend {
  id: string;
  amount: string;
  coin_symbol: string;
  to_address: string;
  status: 'pending' | 'admin_approved' | 'super_admin_approved' | 'rejected' | 'completed' | 'failed';
  processing_type: 'automatic' | 'manual' | null;
  created_at: string;
  transaction_id: string;
  user_id: string;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
  super_admin_approved_by: string | null;
  super_admin_approved_at: string | null;
  was_sent: boolean;
  sent_at: string | null;
  is_internal_transfer?: boolean;
  recipient_user_id?: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
  admin_approver?: {
    email: string;
    full_name: string | null;
  } | null;
  recipient?: {
    email: string;
    full_name: string | null;
  } | null;
  transactions: {
    network_fee: string | null;
    notes: string | null;
  };
}

export interface ApproveRequest {
  requestId: string;
}

export interface RejectRequest {
  requestId: string;
  reason: string;
}

export interface MarkSentManualRequest {
  requestId: string;
  txHash?: string;
}

/**
 * Fetch pending send requests
 */
async function fetchPendingSends(): Promise<{ pendingSends: PendingSend[] }> {
  const response = await fetch('/api/admin/sends/pending');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch pending sends');
  }

  return response.json();
}

/**
 * Admin approve send (does NOT send crypto)
 */
async function adminApproveSend(data: ApproveRequest): Promise<unknown> {
  const response = await fetch('/api/admin/sends/admin-approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve send');
  }

  return response.json();
}

/**
 * Super admin approve and send crypto via Plisio
 */
async function superAdminApproveSend(data: ApproveRequest): Promise<unknown> {
  const response = await fetch('/api/admin/sends/super-admin-approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve and send');
  }

  return response.json();
}

/**
 * Reject send request
 */
async function rejectSend(data: RejectRequest): Promise<unknown> {
  const response = await fetch('/api/admin/sends/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject send');
  }

  return response.json();
}

/**
 * Mark send as sent manually (off-platform)
 */
async function markSentManual(data: MarkSentManualRequest): Promise<unknown> {
  const response = await fetch('/api/admin/sends/mark-sent-manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark as sent');
  }

  return response.json();
}

/**
 * Fetch current user profile (for role checking)
 */
async function fetchCurrentUserProfile(): Promise<{ role: string }> {
  const response = await fetch('/api/user/profile');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user profile');
  }

  return response.json();
}

/**
 * Hook to fetch current user's profile and role
 *
 * @returns Query result with user profile
 */
export function useCurrentUserRole() {
  return useQuery({
    queryKey: ['user', 'profile', 'role'],
    queryFn: fetchCurrentUserProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch pending send requests
 *
 * Features:
 * - Auto-refetch every 30 seconds
 * - Automatic retries
 * - Loading and error states
 *
 * @returns Query result with pending sends
 */
export function usePendingSends() {
  return useQuery({
    queryKey: ['admin', 'sends', 'pending'],
    queryFn: fetchPendingSends,
    retry: 2,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook for admin to approve send request (does NOT send crypto)
 *
 * Features:
 * - Invalidates pending sends query on success
 * - Shows loading state during approval
 *
 * @returns Mutation object
 */
export function useAdminApproveSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApproveSend,
    onSuccess: () => {
      // Invalidate and refetch pending sends
      queryClient.invalidateQueries({ queryKey: ['admin', 'sends', 'pending'] });
    },
    onError: (error) => {
      const parsedError = parseAdminError(error);
      console.error('Admin approve send failed:', {
        original: error,
        parsed: parsedError,
      });
    },
  });
}

/**
 * Hook for super admin to approve and send crypto
 *
 * Features:
 * - Invalidates pending sends query on success
 * - Shows loading state during approval and sending
 * - Also invalidates transactions and wallets
 *
 * @returns Mutation object
 */
export function useSuperAdminApproveSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: superAdminApproveSend,
    onSuccess: () => {
      // Invalidate and refetch pending sends
      queryClient.invalidateQueries({ queryKey: ['admin', 'sends', 'pending'] });
      // Also invalidate transactions and wallets
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (error) => {
      const parsedError = parseAdminError(error);
      console.error('Super admin approve and send failed:', {
        original: error,
        parsed: parsedError,
      });
    },
  });
}

/**
 * Hook to reject send request (mutation)
 *
 * Features:
 * - Invalidates pending sends query on success
 * - Shows loading state during rejection
 *
 * @returns Mutation object
 */
export function useRejectSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectSend,
    onSuccess: () => {
      // Invalidate and refetch pending sends
      queryClient.invalidateQueries({ queryKey: ['admin', 'sends', 'pending'] });
      // Also invalidate transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      const parsedError = parseAdminError(error);
      console.error('Reject send failed:', {
        original: error,
        parsed: parsedError,
      });
    },
  });
}

/**
 * Hook to mark send as sent manually (mutation)
 *
 * Features:
 * - Invalidates pending sends query on success
 * - Shows loading state during marking
 * - Also invalidates transactions and wallets
 *
 * @returns Mutation object
 */
export function useMarkSentManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markSentManual,
    onSuccess: () => {
      // Invalidate and refetch pending sends
      queryClient.invalidateQueries({ queryKey: ['admin', 'sends', 'pending'] });
      // Also invalidate transactions and wallets
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (error) => {
      const parsedError = parseAdminError(error);
      console.error('Mark sent manual failed:', {
        original: error,
        parsed: parsedError,
      });
    },
  });
}

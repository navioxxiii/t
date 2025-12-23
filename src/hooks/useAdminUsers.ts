/**
 * Admin Users TanStack Query Hooks
 * Hooks for managing users in the admin panel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'super_admin';
  balance: number;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  last_login_at: string | null;
  banned_at: string | null;
  banned_reason: string | null;
  email_verified: boolean;
  kyc_status: string | null;
  kyc_tier: string | null;
}

export interface UserDetailsResponse {
  profile: UserProfile;
  wallets: unknown[];
  recent_transactions: unknown[];
}

/**
 * Hook to fetch user details by ID
 */
export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');
      return response.json() as Promise<UserDetailsResponse>;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to update user role (super_admin only)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'admin' | 'super_admin';
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      // Invalidate user details
      queryClient.invalidateQueries({
        queryKey: ['admin-user', variables.userId],
      });

      toast.success('Role Updated', {
        description: `User role changed to ${variables.role}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to ban or unban a user
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      is_banned,
      reason,
    }: {
      userId: string;
      is_banned: boolean;
      reason?: string;
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update ban status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      // Invalidate user details
      queryClient.invalidateQueries({
        queryKey: ['admin-user', variables.userId],
      });

      toast.success(
        variables.is_banned ? 'User Banned' : 'User Unbanned',
        {
          description: variables.is_banned
            ? 'The user has been banned successfully'
            : 'The user has been unbanned successfully',
        }
      );
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });
}

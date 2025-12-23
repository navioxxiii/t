/**
 * Admin Earn Vaults React Query Hooks
 * Handles data fetching and mutations for vault management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VaultQueryParams {
  pageIndex?: number;
  pageSize?: number;
  globalFilter?: string;
  status?: string;
  risk?: string;
  duration?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface CreateVaultData {
  title: string;
  subtitle?: string;
  apy_percent: number;
  duration_months: number;
  min_amount: number;
  max_amount?: number;
  total_capacity?: number;
  risk_level: string;
  status?: string;
}

interface UpdateVaultData {
  title?: string;
  subtitle?: string;
  apy_percent?: number;
  duration_months?: number;
  min_amount?: number;
  max_amount?: number;
  total_capacity?: number;
  risk_level?: string;
  status?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all vaults (including hidden ones)
 */
export function useAdminEarnVaults(params: VaultQueryParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.pageIndex !== undefined) queryParams.set('pageIndex', params.pageIndex.toString());
  if (params.pageSize !== undefined) queryParams.set('pageSize', params.pageSize.toString());
  if (params.globalFilter) queryParams.set('globalFilter', params.globalFilter);
  if (params.status) queryParams.set('status', params.status);
  if (params.risk) queryParams.set('risk', params.risk);
  if (params.duration) queryParams.set('duration', params.duration);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  return useQuery({
    queryKey: ['admin-earn-vaults', params],
    queryFn: async () => {
      const response = await fetch(`/api/admin/earn-vaults?${queryParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch vaults');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch single vault with detailed stats
 */
export function useAdminEarnVault(vaultId: string) {
  return useQuery({
    queryKey: ['admin-earn-vault', vaultId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/earn-vaults/${vaultId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch vault');
      }

      return response.json();
    },
    enabled: !!vaultId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create new vault
 */
export function useCreateEarnVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVaultData) => {
      const response = await fetch('/api/admin/earn-vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create vault');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-vaults'] });

      const visibilityMessage = data.vault.status === 'active'
        ? 'and is now visible to investors'
        : 'but is hidden from investors';

      toast.success('Vault Created', {
        description: `"${data.vault.title}" has been created ${visibilityMessage}.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Create Vault', {
        description: error.message,
      });
    },
  });
}

/**
 * Update existing vault
 */
export function useUpdateEarnVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vaultId, data }: { vaultId: string; data: UpdateVaultData }) => {
      const response = await fetch(`/api/admin/earn-vaults/${vaultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update vault');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-vaults'] });
      queryClient.invalidateQueries({ queryKey: ['admin-earn-vault', variables.vaultId] });

      toast.success('Vault Updated', {
        description: `"${data.vault.title}" has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Update Vault', {
        description: error.message,
      });
    },
  });
}

/**
 * Toggle vault status (visibility control)
 */
export function useToggleVaultStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vaultId, status }: { vaultId: string; status: string }) => {
      const response = await fetch(`/api/admin/earn-vaults/${vaultId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-earn-vaults'] });
      queryClient.invalidateQueries({ queryKey: ['admin-earn-vault', data.vault.id] });

      // Also invalidate user-facing vaults (in case admin is testing)
      queryClient.invalidateQueries({ queryKey: ['/api/earn/vaults'] });

      const icon = data.vault.status === 'active' ? '👁️' : '🚫';

      toast.success(`${icon} Visibility Updated`, {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to Update Status', {
        description: error.message,
      });
    },
  });
}

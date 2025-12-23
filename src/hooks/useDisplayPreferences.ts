/**
 * Display Preferences Hooks
 * Manage user display preferences for coin list filtering
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DisplayPreferences {
  show_non_zero_only: boolean;
}

/**
 * Hook to fetch user's display preferences
 */
export function useDisplayPreferences() {
  return useQuery({
    queryKey: ['display-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/profile/display-preferences');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch display preferences');
      }
      const data = await res.json();
      return data.preferences as DisplayPreferences;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user's display preferences
 */
export function useUpdateDisplayPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<DisplayPreferences>) => {
      const res = await fetch('/api/profile/display-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update display preferences');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['display-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['filtered-balances'] });
    },
  });
}

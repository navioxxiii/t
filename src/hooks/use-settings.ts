/**
 * Settings Hooks
 * React Query hooks for managing settings
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Setting, SettingCategory, FeatureFlag } from '@/types/settings';

/**
 * Fetch all settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return data.settings as Setting[];
    },
    staleTime: 0, // Always fetch fresh
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
  });
}

/**
 * Get settings by category
 */
export function useSettingsByCategory(category: SettingCategory) {
  const { data: settings, ...rest } = useSettings();

  const categorySettings = settings?.filter((s) => s.category === category) || [];

  return {
    settings: categorySettings,
    ...rest,
  };
}

/**
 * Get a single setting value
 */
export function useSetting<T = string | number | boolean>(key: string, defaultValue?: T): T | undefined {
  const { data: settings } = useSettings();

  const setting = settings?.find((s) => s.key === key);

  if (!setting) return defaultValue;

  // Type conversion based on data_type
  switch (setting.data_type) {
    case 'number':
      return Number(setting.value) as T;
    case 'boolean':
      return (setting.value === 'true') as T;
    case 'json':
      try {
        return JSON.parse(setting.value) as T;
      } catch {
        return defaultValue;
      }
    default:
      return setting.value as T;
  }
}

/**
 * Save settings for a category
 */
export function useSaveSettings(category: SettingCategory) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ key: string; value: string }>) => {
      const response = await fetch(`/api/settings/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

/**
 * Feature flag hook - easy access to boolean flags
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useSetting<boolean>(flag, false) ?? false;
}

/**
 * Check if maintenance mode is active
 */
export function useMaintenanceMode() {
  return useFeatureFlag('maintenance_mode');
}

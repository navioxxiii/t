/**
 * Settings Server Actions
 * Server-side logic for managing application settings
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Setting, SettingCategory, CategoryUpdatePayload, ValidationRules } from '@/types/settings';
import { revalidatePath } from 'next/cache';

/**
 * Get all settings with role-based filtering
 */
export async function getSettings(): Promise<{
  success: boolean;
  settings?: Setting[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';

    // Only admins can view settings
    if (role !== 'admin' && role !== 'super_admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    const isSuperAdmin = role === 'super_admin';

    // Build query
    let query = supabase
      .from('settings')
      .select('*')
      .order('category')
      .order('display_name');

    // Filter out super_admin settings for regular admins
    if (!isSuperAdmin) {
      query = query.eq('requires_super_admin', false);
    }

    const { data: settings, error } = await query;

    if (error) throw error;

    return {
      success: true,
      settings: settings || [],
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(
  category: SettingCategory
): Promise<{
  success: boolean;
  settings?: Setting[];
  error?: string;
}> {
  try {
    const result = await getSettings();

    if (!result.success || !result.settings) {
      return result;
    }

    const filtered = result.settings.filter((s) => s.category === category);

    return { success: true, settings: filtered };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save settings for a specific category
 */
export async function saveCategorySettings(
  payload: CategoryUpdatePayload
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';

    // Check minimum permission (admin)
    if (role !== 'admin' && role !== 'super_admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    const isSuperAdmin = role === 'super_admin';

    // Validate and update each setting
    for (const setting of payload.settings) {
      // Get setting metadata to check permissions
      const { data: settingData } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('key', setting.key)
        .eq('category', payload.category)
        .single();

      if (!settingData) {
        return { success: false, error: `Setting ${setting.key} not found` };
      }

      // Check if user can modify this setting
      if (settingData.requires_super_admin && !isSuperAdmin) {
        return {
          success: false,
          error: `Only super admins can modify: ${settingData.display_name}`,
        };
      }

      // Validate value
      const validationResult = validateSettingValue(
        setting.value,
        settingData.data_type,
        settingData.validation_rules
      );

      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed for ${settingData.display_name}: ${validationResult.error}`,
        };
      }

      // Update setting
      const { error: updateError } = await supabaseAdmin
        .from('settings')
        .update({
          value: setting.value,
          updated_by: user.email || user.id,
        })
        .eq('key', setting.key);

      if (updateError) throw updateError;
    }

    // Revalidate settings page
    revalidatePath('/admin/settings');

    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate setting value against rules
 */
function validateSettingValue(
  value: string,
  dataType: string,
  rules?: ValidationRules | null
): { valid: boolean; error?: string } {
  // Type validation
  switch (dataType) {
    case 'number':
      if (isNaN(Number(value))) {
        return { valid: false, error: 'Must be a number' };
      }
      break;
    case 'boolean':
      if (!['true', 'false'].includes(value.toLowerCase())) {
        return { valid: false, error: 'Must be true or false' };
      }
      break;
    case 'json':
      try {
        JSON.parse(value);
      } catch {
        return { valid: false, error: 'Invalid JSON format' };
      }
      break;
  }

  // Rules validation
  if (rules) {
    if (rules.required && !value) {
      return { valid: false, error: 'This field is required' };
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
      return { valid: false, error: `Must be at least ${rules.min}` };
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      return { valid: false, error: `Must be at most ${rules.max}` };
    }

    if (rules.minLength && value.length < rules.minLength) {
      return {
        valid: false,
        error: `Must be at least ${rules.minLength} characters`,
      };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        error: `Must be at most ${rules.maxLength} characters`,
      };
    }

    if (rules.regex && !new RegExp(rules.regex).test(value)) {
      return { valid: false, error: 'Invalid format' };
    }

    if (rules.enum && !rules.enum.includes(value) && !rules.enum.includes(Number(value))) {
      return { valid: false, error: `Must be one of: ${rules.enum.join(', ')}` };
    }
  }

  return { valid: true };
}

/**
 * Get a single setting value by key
 */
export async function getSetting(key: string): Promise<{
  success: boolean;
  value?: string | number | boolean | unknown;
  error?: string;
}> {
  try {
    const result = await getSettings();

    if (!result.success || !result.settings) {
      return { success: false, error: result.error };
    }

    const setting = result.settings.find((s) => s.key === key);

    if (!setting) {
      return { success: false, error: `Setting ${key} not found` };
    }

    // Convert value based on data type
    let convertedValue: string | number | boolean | unknown = setting.value;

    switch (setting.data_type) {
      case 'number':
        convertedValue = Number(setting.value);
        break;
      case 'boolean':
        convertedValue = setting.value === 'true';
        break;
      case 'json':
        try {
          convertedValue = JSON.parse(setting.value);
        } catch {
          convertedValue = setting.value;
        }
        break;
    }

    return { success: true, value: convertedValue };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

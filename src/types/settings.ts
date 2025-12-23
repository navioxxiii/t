/**
 * Settings Types
 * Type definitions for the application settings system
 */

// Setting data types
export type SettingDataType = 'string' | 'number' | 'boolean' | 'json';

// Setting categories
export type SettingCategory = 'system' | 'wallet' | 'security';

// User roles
export type Role = 'user' | 'admin' | 'super_admin';

// Validation rules
export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  enum?: (string | number)[];
}

// Main Setting interface
export interface Setting {
  id: string;
  key: string;
  value: string;
  default_value: string;
  data_type: SettingDataType;
  category: SettingCategory;
  display_name: string;
  description?: string;
  requires_super_admin: boolean;
  validation_rules?: ValidationRules;
  updated_at: string;
  updated_by?: string;
}

// Typed setting value getter
export type SettingValue<T = string | number | boolean | unknown> = T;

// Settings grouped by category
export interface CategorizedSettings {
  system: Setting[];
  wallet: Setting[];
  security: Setting[];
}

// Category update payload
export interface CategoryUpdatePayload {
  category: SettingCategory;
  settings: Array<{
    key: string;
    value: string;
  }>;
}

// Feature flags for easy access
export type FeatureFlag =
  | 'maintenance_mode'
  | 'enable_new_registrations'
  | 'enable_swaps'
  | 'enable_withdrawals';

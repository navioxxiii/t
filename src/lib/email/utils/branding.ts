/**
 * Email Branding Utilities
 * Helper functions to get branding data for email templates
 */

import { branding } from '@/config/branding';

/**
 * Get full URL for email links
 */
export function getEmailUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || branding.urls.base;
  return `${baseUrl}${path}`;
}

/**
 * Get dashboard URL
 */
export function getDashboardUrl(): string {
  return getEmailUrl(branding.email.urls.dashboard);
}

/**
 * Get settings URL
 */
export function getSettingsUrl(): string {
  return getEmailUrl(branding.email.urls.settings);
}

/**
 * Get security settings URL
 */
export function getSecurityUrl(): string {
  return getEmailUrl(branding.email.urls.security);
}

/**
 * Get KYC settings URL
 */
export function getKYCUrl(): string {
  return getEmailUrl(branding.email.urls.kyc);
}

/**
 * Get support URL
 */
export function getSupportUrl(): string {
  return getEmailUrl(branding.email.urls.support);
}

/**
 * Get activity/transactions URL
 */
export function getActivityUrl(): string {
  return getEmailUrl(branding.email.urls.activity);
}

/**
 * Get copy trade URL
 */
export function getCopyTradeUrl(): string {
  return getEmailUrl(branding.email.urls.copyTrade);
}

/**
 * Get earn URL
 */
export function getEarnUrl(): string {
  return getEmailUrl(branding.email.urls.earn);
}

/**
 * Get app name
 */
export function getAppName(): string {
  return branding.name.full;
}

/**
 * Get team name for signatures
 */
export function getTeamName(): string {
  return branding.email.content.teamName;
}

/**
 * Get support message
 */
export function getSupportMessage(): string {
  return branding.email.content.supportMessage;
}

/**
 * Get signature text
 */
export function getSignature(): string {
  return branding.email.content.signature;
}

/**
 * Get support email
 */
export function getSupportEmail(): string {
  return branding.company.email;
}

/**
 * Get email colors
 */
export function getEmailColors() {
  return branding.email.colors;
}


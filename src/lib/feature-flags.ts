/**
 * Feature Flags Configuration
 * Centralized feature toggle management
 */

/**
 * Earn Feature Toggle
 * Controls visibility and availability of fixed-term investment vaults
 * When false: navigation hidden, routes return 404, zero DB load
 */
export const EARN_ENABLED = process.env.NEXT_PUBLIC_EARN_ENABLED === 'true';

/**
 * Copy Trade Feature Toggle
 * Controls visibility and availability of copy-trading platform
 * When false: navigation hidden, routes return 404, zero DB load
 */
export const COPY_TRADE_ENABLED = process.env.NEXT_PUBLIC_COPY_TRADE_ENABLED === 'true';

/**
 * Helper to check if a feature is enabled
 * Usage: if (!isFeatureEnabled('earn')) return notFound()
 */
export function isFeatureEnabled(feature: 'earn' | 'copy-trade'): boolean {
  switch (feature) {
    case 'earn':
      return EARN_ENABLED;
    case 'copy-trade':
      return COPY_TRADE_ENABLED;
    default:
      return false;
  }
}

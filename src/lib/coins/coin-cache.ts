/**
 * Unified Coin Cache Service
 * Centralized in-memory cache for coin configurations with warmup on module load
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface CoinConfig {
  id: number;
  symbol: string;
  name: string;
  logo_url: string | null;
  network: string | null;
  is_plisio: boolean;
  plisio_cid: string | null;
  default_address: string | null;
  decimals: number;
  min_amount: number;
  icon: string | null;
  binance_id: string | null;
  coingecko_id: string | null;
  primary_provider: string | null;
  // Keep for backward compatibility
  price_provider: string | null;
  price_provider_id: string | null;
  is_stablecoin: boolean;
  is_active: boolean;
}

class CoinCache {
  private cache: Map<string, CoinConfig> = new Map();
  private lastFetch: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private warmupPromise: Promise<void> | null = null;

  constructor() {
    // OPTIMIZATION: Warm cache immediately on module load
    // This ensures first request doesn't wait for DB query
    this.warmupPromise = this.refreshCache().catch((error) => {
      console.error('[CoinCache] Warmup failed:', error);
      this.warmupPromise = null; // Allow retry on first request
    });
  }

  /**
   * Get a single coin by symbol
   */
  async getCoin(symbol: string): Promise<CoinConfig | null> {
    // Wait for warmup if still in progress
    if (this.warmupPromise) {
      await this.warmupPromise;
      this.warmupPromise = null;
    }

    // Return from cache if fresh
    if (this.isCacheValid() && this.cache.has(symbol)) {
      return this.cache.get(symbol)!;
    }

    // Refresh cache if stale
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    return this.cache.get(symbol) || null;
  }

  /**
   * Get all active coins
   */
  async getAllCoins(): Promise<CoinConfig[]> {
    // Wait for warmup if still in progress
    if (this.warmupPromise) {
      await this.warmupPromise;
      this.warmupPromise = null;
    }

    if (!this.isCacheValid()) {
      await this.refreshCache();
    }
    return Array.from(this.cache.values());
  }

  /**
   * Get coins filtered by price provider
   */
  async getCoinsByProvider(provider: string): Promise<CoinConfig[]> {
    const coins = await this.getAllCoins();
    return coins.filter(c => c.price_provider === provider && c.is_active);
  }

  /**
   * Refresh the cache from database
   * Now queries base_tokens table (new centralized system)
   */
  private async refreshCache(): Promise<void> {
    const supabase = createAdminClient();

    // Query base_tokens with their deployments
    const { data: baseTokens, error } = await supabase
      .from('base_tokens')
      .select(`
        id,
        symbol,
        name,
        logo_url,
        icon,
        decimals,
        is_stablecoin,
        is_active,
        binance_id,
        coingecko_id,
        primary_provider,
        price_provider,
        price_provider_id,
        token_deployments (
          id,
          symbol,
          network_id,
          is_plisio,
          plisio_cid,
          default_address,
          networks (
            name
          )
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('[CoinCache] Failed to refresh cache:', error);
      throw error;
    }

    if (baseTokens) {
      this.cache.clear();

      // Create cache entries for base tokens
      baseTokens.forEach(token => {
        // Get first deployment for network-specific data (for backward compatibility)
        const firstDeployment = token.token_deployments?.[0];

        // Create CoinConfig entry using base token data
        const coinConfig: CoinConfig = {
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          logo_url: token.logo_url,
          icon: token.icon,
          decimals: token.decimals,
          is_stablecoin: token.is_stablecoin,
          is_active: token.is_active,
          binance_id: token.binance_id,
          coingecko_id: token.coingecko_id,
          primary_provider: token.primary_provider,
          // Keep for backward compatibility
          price_provider: token.price_provider,
          price_provider_id: token.price_provider_id,
          // Network-specific fields from first deployment (backward compatibility)
          network: (firstDeployment?.networks as any)?.name || null,
          is_plisio: firstDeployment?.is_plisio || false,
          plisio_cid: firstDeployment?.plisio_cid || null,
          default_address: firstDeployment?.default_address || null,
          min_amount: 0, // TODO: Add to base_tokens table if needed
        };

        this.cache.set(token.symbol, coinConfig);
      });

      this.lastFetch = Date.now();
      console.log(`[CoinCache] Loaded ${baseTokens.length} base tokens into cache`);
    }
  }

  /**
   * Check if cache is still valid (within TTL)
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.TTL;
  }

  /**
   * Force refresh the cache (useful for admin actions)
   */
  async forceRefresh(): Promise<void> {
    await this.refreshCache();
  }
}

// Export singleton instance
export const coinCache = new CoinCache();

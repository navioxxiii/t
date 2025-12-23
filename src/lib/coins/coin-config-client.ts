/**
 * Client-side Coin Configuration Service
 * Fetches coin configurations from the API and caches them
 */

export interface CoinConfigData {
  symbol: string;
  name: string;
  logo_url: string | null;
  network: string | null;
  icon: string | null;
  decimals: number;
  min_amount: number;
  is_stablecoin: boolean;
  binance_id: string | null;
  coingecko_id: string | null;
  primary_provider: string | null;

  // Keep for backward compatibility during migration
  price_provider?: string | null;
  price_provider_id?: string | null;
}

export interface CoinConfig {
  coins: CoinConfigData[];
  providerMap: Record<string, {
    binanceId: string | null;
    coingeckoId: string | null;
    primaryProvider: string;
    isStablecoin: boolean;
  }>;
}

class CoinConfigClient {
  private cache: CoinConfig | null = null;
  private fetchPromise: Promise<CoinConfig> | null = null;
  private lastFetch: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get coin configuration from API (cached)
   */
  async getConfig(): Promise<CoinConfig> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.lastFetch < this.TTL) {
      return this.cache;
    }

    // If already fetching, return existing promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new data
    this.fetchPromise = this.fetchConfig();

    try {
      const config = await this.fetchPromise;
      this.cache = config;
      this.lastFetch = Date.now();
      return config;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Get a single coin by symbol
   */
  async getCoin(symbol: string): Promise<CoinConfigData | undefined> {
    const config = await this.getConfig();
    return config.coins.find(c => c.symbol === symbol);
  }

  /**
   * Get price provider info for a symbol
   * @deprecated Use getBinanceId(), getCoingeckoId(), getPrimaryProvider() instead
   */
  async getProviderInfo(symbol: string): Promise<{ provider: string; id: string; isStablecoin: boolean } | undefined> {
    const config = await this.getConfig();
    const info = config.providerMap[symbol.toUpperCase()];
    if (!info) return undefined;

    // Return legacy format for backward compatibility
    const id = info.primaryProvider === 'binance_us' ? info.binanceId : info.coingeckoId;
    return {
      provider: info.primaryProvider,
      id: id || symbol.toLowerCase(),
      isStablecoin: info.isStablecoin,
    };
  }

  /**
   * Get Binance trading pair ID for a symbol
   */
  async getBinanceId(symbol: string): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.providerMap[symbol.toUpperCase()]?.binanceId ?? undefined;
  }

  /**
   * Get CoinGecko coin ID for a symbol
   */
  async getCoingeckoId(symbol: string): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.providerMap[symbol.toUpperCase()]?.coingeckoId ?? undefined;
  }

  /**
   * Get primary provider preference for a symbol
   */
  async getPrimaryProvider(symbol: string): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.providerMap[symbol.toUpperCase()]?.primaryProvider;
  }

  /**
   * Get all coins for a specific provider
   */
  async getCoinsByProvider(provider: string): Promise<CoinConfigData[]> {
    const config = await this.getConfig();
    return config.coins.filter(c => c.price_provider === provider);
  }

  /**
   * Fetch configuration from API
   */
  private async fetchConfig(): Promise<CoinConfig> {
    try {
      const response = await fetch('/api/coins/config');

      if (!response.ok) {
        throw new Error(`Failed to fetch coin config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CoinConfigClient] Error fetching config:', error);
      // Return fallback empty config
      return {
        coins: [],
        providerMap: {},
      };
    }
  }

  /**
   * Clear cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const coinConfigClient = new CoinConfigClient();

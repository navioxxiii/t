import { BinanceProvider } from "./providers/binance-provider";
import { BinanceUSProvider } from "./providers/binance-us-provider";
import { CoinGeckoProvider } from "./providers/coingecko-provider";
import { coinConfigClient } from "@/lib/coins/coin-config-client";

export interface CoinPrice {
  symbol: string;
  id: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
  provider: string;
}

export interface PriceProvider {
  name: string;
  fetchPrices(symbols: string[]): Promise<Map<string, CoinPrice>>;
  isAvailable(): Promise<boolean>;
}

export class PricesClient {
  private providers: PriceProvider[];

  constructor() {
    // Priority order: Binance US first (for US users), then CoinGecko
    this.providers = [
      new BinanceUSProvider(),
      // new BinanceProvider(),
      new CoinGeckoProvider(),
    ];
  }

  /**
   * Fetch prices using multiple providers in parallel based on primary_provider
   */
  async fetchPrices(symbols: string[]): Promise<Map<string, CoinPrice>> {
    if (symbols.length === 0) {
      return new Map();
    }

    // Get coin configs to determine primary_provider for each symbol
    const coinConfig = await coinConfigClient.getConfig();

    // Split symbols by primary provider and handle stablecoins
    const binanceSymbols: string[] = [];
    const coingeckoSymbols: string[] = [];
    const allPrices = new Map<string, CoinPrice>();

    for (const symbol of symbols) {
      const coinInfo = coinConfig.providerMap[symbol.toUpperCase()];
      if (!coinInfo) {
        // console.warn(`[PricesClient] No config found for ${symbol}`);
        continue;
      }

      // Handle stablecoins FIRST (before provider routing)
      if (coinInfo.isStablecoin) {
        allPrices.set(symbol, {
          symbol,
          id: symbol.toLowerCase(),
          current_price: 1.0,
          price_change_24h: 0,
          price_change_percentage_24h: 0,
          market_cap: 0,
          total_volume: 0,
          last_updated: new Date().toISOString(),
          provider: 'stablecoin',
        });
        // console.log(`[PricesClient] Stablecoin ${symbol} set to $1.00`);
        continue; // Skip provider routing for stablecoins
      }

      // Route non-stablecoins to their providers
      if (coinInfo.primaryProvider === 'binance_us' && coinInfo.binanceId) {
        binanceSymbols.push(symbol);
      } else if (coinInfo.primaryProvider === 'coingecko' && coinInfo.coingeckoId) {
        coingeckoSymbols.push(symbol);
      } else {
        // Fallback: try binance first, then coingecko
        if (coinInfo.binanceId) {
          binanceSymbols.push(symbol);
        } else if (coinInfo.coingeckoId) {
          coingeckoSymbols.push(symbol);
        }
      }
    }

    // console.log(`[PricesClient] Fetching from providers:`, {
    //   stablecoins: allPrices.size,
    //   binanceSymbols,
    //   coingeckoSymbols,
    // });

    // Fetch from both providers in parallel
    const [binanceResults, coingeckoResults] = await Promise.allSettled([
      binanceSymbols.length > 0
        ? this.providers[0].fetchPrices(binanceSymbols) // BinanceUSProvider
        : Promise.resolve(new Map<string, CoinPrice>()),
      coingeckoSymbols.length > 0
        ? this.providers[1].fetchPrices(coingeckoSymbols) // CoinGeckoProvider
        : Promise.resolve(new Map<string, CoinPrice>()),
    ]);

    // Merge results from providers into allPrices (which already has stablecoins)
    if (binanceResults.status === 'fulfilled') {
      binanceResults.value.forEach((price, symbol) => {
        allPrices.set(symbol, price);
      });
      // console.log(`[PricesClient] Binance fetched ${binanceResults.value.size} prices`);
    } else {
      // console.error(`[PricesClient] Binance failed:`, binanceResults.reason);
    }

    if (coingeckoResults.status === 'fulfilled') {
      coingeckoResults.value.forEach((price, symbol) => {
        allPrices.set(symbol, price);
      });
      // console.log(`[PricesClient] CoinGecko fetched ${coingeckoResults.value.size} prices`);
    } else {
      // console.error(`[PricesClient] CoinGecko failed:`, coingeckoResults.reason);
    }

    // Handle missing symbols (fallback)
    const fetchedSymbols = new Set(allPrices.keys());
    const missingSymbols = symbols.filter(s => !fetchedSymbols.has(s));

    if (missingSymbols.length > 0) {
      // console.warn(`[PricesClient] Missing prices for:`, missingSymbols);
    }

    if (allPrices.size === 0) {
      throw new Error("All price providers failed");
    }

    return allPrices;
  }

}

// Singleton instance
export const pricesClient = new PricesClient();

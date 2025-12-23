import { CoinPrice, PriceProvider } from "../prices-client";
import { coinConfigClient } from "@/lib/coins/coin-config-client";

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

export class CoinGeckoProvider implements PriceProvider {
  name = "CoinGecko";

  async isAvailable(): Promise<boolean> {
    try {
      // Test with our proxy endpoint
      const response = await fetch("/api/coingecko");
      return response.ok;
    } catch (error) {
      console.warn("[CoinGeckoProvider] Not available:", error);
      return false;
    }
  }

  async fetchPrices(symbols: string[]): Promise<Map<string, CoinPrice>> {
    if (symbols.length === 0) {
      return new Map();
    }

    const priceMap = new Map<string, CoinPrice>();

    // Get CoinGecko IDs for each symbol
    const coingeckoIdPromises = symbols.map(async (symbol) => ({
      symbol,
      coingeckoId: await coinConfigClient.getCoingeckoId(symbol),
      isStablecoin: (await coinConfigClient.getConfig()).providerMap[symbol]?.isStablecoin,
    }));
    const coinInfos = await Promise.all(coingeckoIdPromises);

    // Separate stablecoins and CoinGecko coins
    const coingeckoSymbols: string[] = [];
    const symbolToId = new Map<string, string>();
    const idToSymbol = new Map<string, string>();

    for (const { symbol, coingeckoId, isStablecoin } of coinInfos) {
      // Handle stablecoins first (no API call needed)
      if (isStablecoin) {
        priceMap.set(symbol, {
          symbol,
          id: symbol.toLowerCase(),
          current_price: 1.0,
          price_change_24h: 0,
          price_change_percentage_24h: 0,
          market_cap: 0,
          total_volume: 0,
          last_updated: new Date().toISOString(),
          provider: this.name,
        });
        continue;
      }

      // Fetch if CoinGecko ID exists (regardless of primary provider)
      if (coingeckoId) {
        coingeckoSymbols.push(symbol);
        symbolToId.set(symbol, coingeckoId);
        idToSymbol.set(coingeckoId, symbol);
      }
    }

    // If no CoinGecko coins, return (all were stablecoins or other providers)
    if (coingeckoSymbols.length === 0) {
      return priceMap;
    }

    try {
      // Build comma-separated list of CoinGecko IDs
      const coinIds = Array.from(symbolToId.values()).join(",");

      // Use our proxy endpoint for the main data fetch
      const response = await fetch(
        `/api/coingecko/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error(
          `CoinGecko proxy API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as CoinGeckoMarketData[];

      // Transform response into our format
      for (const item of data) {
        const symbol = idToSymbol.get(item.id);
        if (!symbol) continue;

        priceMap.set(symbol, {
          symbol,
          id: item.id,
          current_price: item.current_price,
          price_change_24h: item.price_change_24h,
          price_change_percentage_24h: item.price_change_percentage_24h,
          market_cap: item.market_cap,
          total_volume: item.total_volume,
          last_updated: item.last_updated,
          provider: this.name,
        });
      }

      return priceMap;
    } catch (error) {
      console.error("Error fetching from CoinGecko proxy:", error);
      throw new Error("Failed to fetch data from CoinGecko");
    }
  }
}

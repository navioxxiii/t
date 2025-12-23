import { CoinPrice, PriceProvider } from "../prices-client";
import { coinConfigClient } from "@/lib/coins/coin-config-client";

interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

export class BinanceUSProvider implements PriceProvider {
  name = "Binance US";

  async isAvailable(): Promise<boolean> {
    try {
      // Test with ping endpoint
      const response = await fetch("/api/binance?ping=true");
      return response.ok;
    } catch (error) {
      console.warn("[BinanceUSProvider] Not available:", error);
      return false;
    }
  }

  async fetchPrices(symbols: string[]): Promise<Map<string, CoinPrice>> {
    if (symbols.length === 0) {
      return new Map();
    }

    const priceMap = new Map<string, CoinPrice>();
    const now = new Date().toISOString();

    // Get Binance IDs for each symbol
    const binanceIdPromises = symbols.map(async (symbol) => ({
      symbol,
      binanceId: await coinConfigClient.getBinanceId(symbol),
      isStablecoin: (await coinConfigClient.getConfig()).providerMap[symbol]?.isStablecoin,
    }));
    const coinInfos = await Promise.all(binanceIdPromises);

    // Separate stablecoins and Binance coins
    const binanceSymbols: string[] = [];
    const symbolToPair = new Map<string, string>();

    for (const { symbol, binanceId, isStablecoin } of coinInfos) {
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
          last_updated: now,
          provider: this.name,
        });
        continue;
      }

      // Fetch if Binance ID exists (regardless of primary provider)
      if (binanceId) {
        binanceSymbols.push(binanceId);
        symbolToPair.set(binanceId, symbol);
      }
    }

    // If no Binance US coins, return (all were stablecoins or other providers)
    if (binanceSymbols.length === 0) {
      return priceMap;
    }

    try {
      // Use batch endpoint to fetch all symbols at once
      const symbolsParam = JSON.stringify(binanceSymbols);
      const response = await fetch(
        `/api/binance?symbols=${encodeURIComponent(symbolsParam)}`
      );

      if (!response.ok) {
        throw new Error(
          `Binance proxy API responded with status: ${response.status}`
        );
      }

      const tickers = (await response.json()) as BinanceTicker[];

      // Create a map for quick lookup
      const tickerMap = new Map<string, BinanceTicker>();
      tickers.forEach((ticker) => {
        tickerMap.set(ticker.symbol, ticker);
      });

      // Process each Binance symbol
      for (const binancePair of binanceSymbols) {
        const ticker = tickerMap.get(binancePair);
        if (!ticker) continue;

        const symbol = symbolToPair.get(binancePair);
        if (!symbol) continue;

        const currentPrice = parseFloat(ticker.lastPrice);
        const priceChange24h = parseFloat(ticker.priceChange);
        const priceChangePercent24h = parseFloat(ticker.priceChangePercent);

        priceMap.set(symbol, {
          symbol,
          id: symbol.toLowerCase(),
          current_price: currentPrice,
          price_change_24h: priceChange24h,
          price_change_percentage_24h: priceChangePercent24h,
          market_cap: 0, // Not provided by Binance ticker endpoint
          total_volume: parseFloat(ticker.quoteVolume),
          last_updated: now,
          provider: this.name,
        });
      }
    } catch (error) {
      console.error("[BinanceUSProvider] Error fetching batch data:", error);
      // Fallback to individual requests if batch fails
      await this.fetchPricesIndividually(Array.from(symbolToPair.entries()), priceMap, now);
    }

    return priceMap;
  }

  private async fetchPricesIndividually(
    pairToSymbol: Array<[string, string]>,
    priceMap: Map<string, CoinPrice>,
    timestamp: string
  ): Promise<void> {
    for (const [binancePair, symbol] of pairToSymbol) {
      try {
        const response = await fetch(`/api/binance?symbol=${binancePair}`);

        if (!response.ok) {
          console.warn(
            `[BinanceUSProvider] Failed to fetch ${binancePair}:`,
            response.status
          );
          continue;
        }

        const ticker = (await response.json()) as BinanceTicker;

        const currentPrice = parseFloat(ticker.lastPrice);
        const priceChange24h = parseFloat(ticker.priceChange);
        const priceChangePercent24h = parseFloat(ticker.priceChangePercent);

        priceMap.set(symbol, {
          symbol,
          id: symbol.toLowerCase(),
          current_price: currentPrice,
          price_change_24h: priceChange24h,
          price_change_percentage_24h: priceChangePercent24h,
          market_cap: 0,
          total_volume: parseFloat(ticker.quoteVolume),
          last_updated: timestamp,
          provider: this.name,
        });
      } catch (error) {
        console.error(
          `[BinanceUSProvider] Error fetching ${binancePair}:`,
          error
        );
      }
    }
  }
}

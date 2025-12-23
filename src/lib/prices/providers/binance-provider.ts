import { Spot } from '@binance/connector-typescript';
import { CoinPrice, PriceProvider } from '../prices-client';
import { coinConfigClient } from '@/lib/coins/coin-config-client';

interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

export class BinanceProvider implements PriceProvider {
  name = 'Binance';
  private client: Spot;

  constructor() {
    this.client = new Spot('', '', {
      baseURL: 'https://api.binance.com',
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple symbol to check if Binance is accessible
      await this.client.ticker24hr({ symbol: 'BTCUSDT' });
      return true;
    } catch (error) {
      console.warn('[BinanceProvider] Not available:', error);
      return false;
    }
  }

  async fetchPrices(symbols: string[]): Promise<Map<string, CoinPrice>> {
    if (symbols.length === 0) {
      return new Map();
    }

    const priceMap = new Map<string, CoinPrice>();
    const now = new Date().toISOString();

    // Get provider info for each symbol from database
    const providerInfoPromises = symbols.map(async (symbol) => ({
      symbol,
      info: await coinConfigClient.getProviderInfo(symbol),
    }));
    const providerInfos = await Promise.all(providerInfoPromises);

    // Separate stablecoins and Binance coins
    const binanceSymbols: string[] = [];
    const pairToSymbol = new Map<string, string>();

    for (const { symbol, info } of providerInfos) {
      if (!info) continue;

      // Handle stablecoins first (no API call needed)
      if (info.isStablecoin) {
        priceMap.set(symbol, {
          symbol,
          id: info.id,
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

      // Only fetch Binance coins
      if (info.provider === 'binance') {
        binanceSymbols.push(info.id);
        pairToSymbol.set(info.id, symbol);
      }
    }

    // If no Binance coins, return (all were stablecoins or other providers)
    if (binanceSymbols.length === 0) {
      return priceMap;
    }

    const tickerMap = new Map<string, BinanceTicker>();

    // Only fetch if we have valid symbols
    if (binanceSymbols.length > 0) {
      const response = await this.client.ticker24hr({ symbols: binanceSymbols }) as BinanceTicker[];

      response.forEach((ticker) => {
        tickerMap.set(ticker.symbol, ticker);
      });
    }

    // Transform response into our format
    for (const binancePair of binanceSymbols) {
      const ticker = tickerMap.get(binancePair);
      if (!ticker) continue;

      const symbol = pairToSymbol.get(binancePair);
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

    return priceMap;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { coinCache } from '@/lib/coins/coin-cache';

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CacheEntry {
  data: ChartDataPoint[];
  timestamp: number;
}

const chartCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (increased from 1 minute)

// Map time periods to days for CoinGecko
const INTERVAL_TO_DAYS: Record<string, string> = {
  '1m': '0.04',   // ~1 hour
  '3m': '0.13',
  '5m': '0.21',
  '15m': '0.63',
  '30m': '1.25',
  '1h': '1',
  '2h': '2',
  '4h': '4',
  '6h': '6',
  '8h': '8',
  '12h': '12',
  '1d': '1',
  '3d': '3',
  '1w': '7',
  '1M': '30',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval") || "1h";
    const limit = searchParams.get("limit") || "168";
    const provider = searchParams.get("provider"); // Optional: 'binance_us' or 'coingecko'

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing symbol parameter" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Validate interval
    const validIntervals = [
      "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"
    ];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval. Must be one of: " + validIntervals.join(", ") },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check cache first
    const cacheKey = `${symbol}-${interval}-${limit}`;
    const now = Date.now();
    const cachedEntry = chartCache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
      console.log("[Chart API] Returning cached data for", cacheKey);
      return NextResponse.json(cachedEntry.data, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // Determine which provider to use
    // 1. Use provider hint from frontend if provided
    // 2. Otherwise auto-detect based on symbol format
    const useProvider = provider || (
      /^[A-Z]+$/.test(symbol) ? 'binance_us' :
      /^[a-z-]+$/.test(symbol) ? 'coingecko' :
      'binance_us' // default to binance
    );

    let chartData: ChartDataPoint[] = [];
    let coingeckoId: string | null = null;

    // Try Binance first if provider is binance_us or symbol looks like Binance
    if (useProvider === 'binance_us' || /^[A-Z]+$/.test(symbol)) {
      try {
        const binanceUrl = `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const response = await fetch(binanceUrl);

        if (response.ok) {
          const data = await response.json();
          chartData = data.map((candle: any[]) => ({
            time: Math.floor(candle[0] / 1000),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
          }));
        } else {
          console.log("[Chart API] Binance failed with status:", response.status);
        }
      } catch (error) {
        console.log("[Chart API] Binance request error:", error);
      }

      // If Binance failed, look up the CoinGecko ID for this Binance symbol
      if (chartData.length === 0) {
        try {
          const coinConfigs = await coinCache.getAllCoins();
          // Find coin by binance_id
          const coinConfig = coinConfigs.find((c: any) => c.binance_id === symbol);
          if (coinConfig?.coingecko_id) {
            coingeckoId = coinConfig.coingecko_id;
            console.log(`[Chart API] Found CoinGecko ID for ${symbol}: ${coingeckoId}`);
          }
        } catch (error) {
          console.error("[Chart API] Failed to lookup CoinGecko ID:", error);
        }
      }
    } else if (useProvider === 'coingecko' || /^[a-z-]+$/.test(symbol)) {
      // It's already a CoinGecko ID, use it directly
      coingeckoId = symbol;
      console.log(`[Chart API] Using CoinGecko provider for symbol: ${symbol}, coingeckoId: ${coingeckoId}`);
    }

    // If Binance failed or it's a CoinGecko ID, try CoinGecko
    if (chartData.length === 0 && coingeckoId) {
      try {
        const days = INTERVAL_TO_DAYS[interval] || '7';
        const baseUrl = request.nextUrl.origin;
        const coingeckoUrl = `${baseUrl}/api/coingecko/market-chart?id=${coingeckoId}&days=${days}&vs_currency=usd`;
        console.log(`[Chart API] Fetching CoinGecko data from: ${coingeckoUrl}`);
        const response = await fetch(coingeckoUrl);

        if (response.ok) {
          const data = await response.json();
          console.log(`[Chart API] CoinGecko response data structure:`, {
            hasPrices: !!data.prices,
            pricesLength: data.prices?.length,
            hasVolumes: !!data.total_volumes,
            volumesLength: data.total_volumes?.length
          });

          // Convert CoinGecko format to our OHLC format (pseudo-candlestick)
          chartData = data.prices.map((pricePoint: [number, number], index: number) => {
            const [timestamp, price] = pricePoint;
            const volume = data.total_volumes[index]?.[1] || 0;

            return {
              time: Math.floor(timestamp / 1000), // Convert ms to seconds
              open: price,    // Use same price for all OHLC values
              high: price,
              low: price,
              close: price,
              volume: volume,
            };
          });
          console.log(`[Chart API] Successfully fetched CoinGecko data for ${coingeckoId}, data points: ${chartData.length}`);
        } else {
          const errorText = await response.text();
          console.error(`[Chart API] CoinGecko failed - Status: ${response.status}, Response: ${errorText}`);
        }
      } catch (error) {
        console.error("[Chart API] CoinGecko request error:", {
          error,
          message: error instanceof Error ? error.message : String(error),
          coingeckoId,
          interval,
          days: INTERVAL_TO_DAYS[interval] || '7'
        });
      }
    }

    // If still no data, return error
    if (chartData.length === 0) {
      console.error(`[Chart API] No chart data available for symbol: ${symbol}, provider: ${useProvider}`);
      return NextResponse.json(
        { error: 'Unable to load chart data. Please try again later.' },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Cache the response
    chartCache.set(cacheKey, {
      data: chartData,
      timestamp: now,
    });

    // Clean old cache entries
    if (chartCache.size > 100) {
      const oldestKey = chartCache.keys().next().value;
      if (oldestKey) chartCache.delete(oldestKey);
    }

    return NextResponse.json(chartData, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("[Chart API] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Unable to load chart data. Please try again later." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

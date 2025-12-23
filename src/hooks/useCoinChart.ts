import { useQuery } from '@tanstack/react-query';
import { coinConfigClient } from '@/lib/coins/coin-config-client';

export interface ChartDataPoint {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartInterval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

export type TimePeriod = '24h' | '7d' | '1m' | '3m' | '1y';

// Map time periods to intervals and limits
export const TIME_PERIOD_CONFIG: Record<TimePeriod, { interval: ChartInterval; limit: number }> = {
  '24h': { interval: '1h', limit: 24 },
  '7d': { interval: '4h', limit: 42 },
  '1m': { interval: '1d', limit: 30 },
  '3m': { interval: '1d', limit: 90 },
  '1y': { interval: '1w', limit: 52 },
};

/**
 * Hook to fetch chart data for a coin
 * @param coinSymbol The coin symbol (e.g., 'BTC', 'ETH')
 * @param timePeriod The time period to display
 * @param isEnabled Whether the query should be enabled (defaults to true)
 */
export function useCoinChart(
  coinSymbol: string | undefined,
  timePeriod: TimePeriod = '7d',
  isEnabled: boolean = true
) {
  const config = TIME_PERIOD_CONFIG[timePeriod];

  return useQuery({
    queryKey: ['coin-chart', coinSymbol, timePeriod],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!coinSymbol) {
        return [];
      }

      // Get chart symbol from database based on primary provider
      const coinConfig = await coinConfigClient.getConfig();
      const coinInfo = coinConfig.providerMap[coinSymbol.toUpperCase()];

      if (!coinInfo) {
        console.error('[useCoinChart] No coin info found for:', coinSymbol);
        throw new Error(`No chart data available for ${coinSymbol}`);
      }

      // Use ID based on primary provider, with fallback
      let chartSymbol: string;
      let primaryProvider: string | undefined;

      if (coinInfo.primaryProvider === 'binance_us' && coinInfo.binanceId) {
        chartSymbol = coinInfo.binanceId;
        primaryProvider = 'binance_us';
      } else if (coinInfo.primaryProvider === 'coingecko' && coinInfo.coingeckoId) {
        chartSymbol = coinInfo.coingeckoId;
        primaryProvider = 'coingecko';
      } else if (coinInfo.binanceId) {
        chartSymbol = coinInfo.binanceId; // Fallback to Binance
        primaryProvider = 'binance_us';
      } else if (coinInfo.coingeckoId) {
        chartSymbol = coinInfo.coingeckoId; // Fallback to CoinGecko
        primaryProvider = 'coingecko';
      } else {
        chartSymbol = coinSymbol; // Last resort
      }

      console.log(`[useCoinChart] Fetching chart for ${coinSymbol}:`, {
        chartSymbol,
        primaryProvider,
        interval: config.interval,
        limit: config.limit
      });

      // Build URL with optional provider parameter
      const url = new URLSearchParams({
        symbol: chartSymbol,
        interval: config.interval,
        limit: config.limit.toString(),
      });

      if (primaryProvider) {
        url.append('provider', primaryProvider);
      }

      const response = await fetch(`/api/chart?${url.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[useCoinChart] Chart fetch failed:', {
          status: response.status,
          error: errorData,
          coinSymbol,
          chartSymbol,
          primaryProvider
        });
        throw new Error(errorData.error || 'Failed to fetch chart data');
      }

      const data = await response.json();
      console.log(`[useCoinChart] Successfully fetched ${data.length} data points for ${coinSymbol}`);
      return data;
    },
    enabled: !!coinSymbol && isEnabled, // Combine both conditions
    staleTime: 60 * 1000, // Consider stale after 60 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

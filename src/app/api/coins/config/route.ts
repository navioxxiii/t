/**
 * Coin Configuration API Endpoint
 * Provides coin configurations to client-side code
 * Cached for 5 minutes to reduce database load
 *
 * NOTE: Now uses base_tokens table (centralized balance system)
 * - Returns one entry per BASE TOKEN (not per deployment)
 * - Price providers stored at base_tokens level
 * - symbolToProviderMap uses base token symbols (BTC, USDT, ETH)
 *
 * Price Provider Hierarchy:
 * - binance_us (Binance US): Primary price source
 * - coingecko (CoinGecko): Fallback when Binance US unavailable
 * - none: Stablecoins (fixed $1.00)
 */

import { NextResponse } from 'next/server';
import { coinCache } from '@/lib/coins/coin-cache';

// Simple in-memory cache
let configCache: {
  data: any;
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (matches coinCache TTL)

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (configCache && now - configCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(configCache.data);
    }

    // Fetch all active coins from cache
    const coins = await coinCache.getAllCoins();

    // Transform to client-friendly format
    const config = {
      coins: coins.map(coin => ({
        symbol: coin.symbol,
        name: coin.name,
        logo_url: coin.logo_url,
        network: coin.network,
        icon: coin.icon,
        decimals: coin.decimals,
        min_amount: coin.min_amount,
        is_stablecoin: coin.is_stablecoin,
        binance_id: coin.binance_id,
        coingecko_id: coin.coingecko_id,
        primary_provider: coin.primary_provider,
        // Keep for backward compatibility
        price_provider: coin.price_provider,
        price_provider_id: coin.price_provider_id,
      })),
      // Create lookup maps for easy access
      providerMap: {} as Record<string, { binanceId: string | null; coingeckoId: string | null; primaryProvider: string; isStablecoin: boolean }>,
    };

    // Build symbol-to-provider mapping
    coins.forEach(coin => {
      config.providerMap[coin.symbol] = {
        binanceId: coin.binance_id,
        coingeckoId: coin.coingecko_id,
        primaryProvider: coin.primary_provider || 'none',
        isStablecoin: coin.is_stablecoin,
      };
    });

    // Cache the response
    configCache = {
      data: config,
      timestamp: now,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('[Coins Config API] Error fetching coin config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin configuration' },
      { status: 500 }
    );
  }
}

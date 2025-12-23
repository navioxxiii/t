import { NextRequest, NextResponse } from "next/server";
import { pricesClient, CoinPrice } from "../../../lib/prices/prices-client";

// Simple in-memory cache for prices (optional, but recommended)
let priceCache: {
  data: CoinPrice[];
  timestamp: number;
} | null = null;
const CACHE_DURATION = 10 * 1000; // 10 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json(
        { error: "Missing symbols parameter" },
        { status: 400 }
      );
    }

    // Parse symbols (should be JSON array string)
    let symbols: string[];
    try {
      symbols = JSON.parse(symbolsParam);
    } catch {
      return NextResponse.json(
        { error: "Invalid symbols format (expected JSON array)" },
        { status: 400 }
      );
    }

    // Check cache first
    const now = Date.now();
    if (priceCache && now - priceCache.timestamp < CACHE_DURATION) {
      console.log('[Prices API] Returning cached data');
      return NextResponse.json(priceCache.data);
    }

    // Fetch from price client (with automatic fallback)
    const priceMap = await pricesClient.fetchPrices(symbols);

    // Convert Map to array for response
    const responseData = Array.from(priceMap.values());

    // Cache the response
    priceCache = {
      data: responseData,
      timestamp: now,
    };

    console.log(
      `[Prices API] Successfully fetched ${responseData.length} prices from multiple providers`
    );
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[Prices API] Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices from all providers" },
      { status: 500 }
    );
  }
}

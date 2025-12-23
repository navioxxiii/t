import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');  // CoinGecko coin ID (e.g., "bitcoin")
    const days = searchParams.get('days') || '7';
    const vs_currency = searchParams.get('vs_currency') || 'usd';

    if (!id) {
      console.error('[CoinGecko Proxy] Missing id parameter');
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Use CoinGecko free API (demo endpoint)
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}`;
    console.log(`[CoinGecko Proxy] Fetching: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko Proxy] API error - Status: ${response.status}, Response: ${errorText}`);

      // Check for specific error types
      if (response.status === 429) {
        console.error('[CoinGecko Proxy] Rate limit exceeded');
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }

      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[CoinGecko Proxy] Success - Received ${data.prices?.length || 0} price points for ${id}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[CoinGecko Proxy] Error fetching from CoinGecko:', {
      error,
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}

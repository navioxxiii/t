import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters from the request
    const vsCurrency = searchParams.get('vs_currency') || 'usd';
    const ids = searchParams.get('ids') || '';
    const order = searchParams.get('order') || 'market_cap_desc';
    const perPage = searchParams.get('per_page') || '100';
    const page = searchParams.get('page') || '1';
    const sparkline = searchParams.get('sparkline') || 'false';
    const priceChangePercentage = searchParams.get('price_change_percentage') || '24h';

    // Build the CoinGecko API URL with all parameters
    const coingeckoUrl = new URL('https://api.coingecko.com/api/v3/coins/markets');
    coingeckoUrl.searchParams.set('vs_currency', vsCurrency);
    if (ids) coingeckoUrl.searchParams.set('ids', ids);
    coingeckoUrl.searchParams.set('order', order);
    coingeckoUrl.searchParams.set('per_page', perPage);
    coingeckoUrl.searchParams.set('page', page);
    coingeckoUrl.searchParams.set('sparkline', sparkline);
    coingeckoUrl.searchParams.set('price_change_percentage', priceChangePercentage);

    const response = await fetch(coingeckoUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching from CoinGecko markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from CoinGecko markets' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
/**
 * GET /api/swap/quote?from=USDT&to=BTC&amount=20
 * Server-priced swap quote - the same pricing /api/swap uses to credit the swap
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSwapQuote } from '@/lib/swap/server-quote';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const amount = parseFloat(searchParams.get('amount') || '');

  if (!from || !to || !isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: 'Cannot swap a coin to itself' }, { status: 400 });
  }

  const quote = await getServerSwapQuote(from, to, amount);
  if (!quote) {
    return NextResponse.json(
      { error: 'Prices are temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  return NextResponse.json({ quote }, { headers: { 'Cache-Control': 'no-store' } });
}

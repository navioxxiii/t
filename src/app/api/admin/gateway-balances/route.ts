/**
 * Admin Gateway Balances API
 * GET /api/admin/gateway-balances - Get crypto balances from Plisio and NowPayments
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { plisio } from '@/lib/plisio/client';
import { nowpayments } from '@/lib/nowpayments/client';

interface PlisioBalanceItem {
  currency: string;
  psys_cid: string;
  balance: string;
  usdValue?: number;
}

interface NowPaymentsBalanceItem {
  currency: string;
  amount: string;
  pendingAmount: string;
  usdValue?: number;
}

interface GatewaySection<T> {
  configured: boolean;
  balances: T[];
  error?: string;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch balances from both gateways and prices concurrently
    const [plisioResult, nowpaymentsResult, pricesResult] = await Promise.allSettled([
      fetchPlisioBalances(),
      fetchNowPaymentsBalances(),
      fetchPrices(),
    ]);

    const plisioData: GatewaySection<PlisioBalanceItem> =
      plisioResult.status === 'fulfilled'
        ? plisioResult.value
        : { configured: true, balances: [], error: plisioResult.reason?.message || 'Failed to fetch Plisio balances' };

    const nowpaymentsData: GatewaySection<NowPaymentsBalanceItem> =
      nowpaymentsResult.status === 'fulfilled'
        ? nowpaymentsResult.value
        : { configured: true, balances: [], error: nowpaymentsResult.reason?.message || 'Failed to fetch NowPayments balances' };

    const prices: Record<string, number> =
      pricesResult.status === 'fulfilled' ? pricesResult.value : {};

    const hasPrices = Object.keys(prices).length > 0;

    // Attach usdValue to each balance item
    if (hasPrices) {
      for (const b of plisioData.balances) {
        const price = prices[b.currency];
        if (price != null) {
          b.usdValue = parseFloat(b.balance) * price;
        }
      }
      for (const b of nowpaymentsData.balances) {
        const price = prices[b.currency];
        if (price != null) {
          b.usdValue = parseFloat(b.amount) * price;
        }
      }
    }

    // Compute totalUsd
    let totalUsd: number | null = null;
    if (hasPrices) {
      totalUsd = 0;
      for (const b of plisioData.balances) {
        if (b.usdValue != null) totalUsd += b.usdValue;
      }
      for (const b of nowpaymentsData.balances) {
        if (b.usdValue != null) totalUsd += b.usdValue;
      }
    }

    return NextResponse.json({
      plisio: plisioData,
      nowpayments: nowpaymentsData,
      prices,
      totalUsd,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Gateway balances API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchPlisioBalances(): Promise<GatewaySection<PlisioBalanceItem>> {
  if (!process.env.PLISIO_SECRET_KEY) {
    return { configured: false, balances: [] };
  }

  const supabase = createAdminClient();

  // Get all Plisio token deployments
  const { data: tokens, error } = await supabase
    .from('token_deployments')
    .select('symbol, gateway_config')
    .eq('gateway', 'plisio')
    .eq('is_active', true);

  if (error || !tokens || tokens.length === 0) {
    return { configured: true, balances: [] };
  }

  // Extract CIDs from gateway_config
  const tokenMap: Array<{ symbol: string; cid: string }> = [];
  for (const t of tokens) {
    const config = t.gateway_config as { cid?: string } | null;
    if (config?.cid) {
      tokenMap.push({ symbol: t.symbol, cid: config.cid });
    }
  }

  const results = await Promise.allSettled(
    tokenMap.map((t) => plisio.getBalance(t.cid))
  );

  const balances: PlisioBalanceItem[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      const data = result.value.data;
      balances.push({
        currency: tokenMap[i].symbol,
        psys_cid: data.psys_cid,
        balance: data.balance,
      });
    }
  }

  return { configured: true, balances };
}

async function fetchNowPaymentsBalances(): Promise<GatewaySection<NowPaymentsBalanceItem>> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    return { configured: false, balances: [] };
  }

  const supabase = createAdminClient();

  // Get all NowPayments token deployments
  const { data: tokens, error } = await supabase
    .from('token_deployments')
    .select('symbol, gateway_config')
    .eq('gateway', 'nowpayments')
    .eq('is_active', true);

  if (error || !tokens || tokens.length === 0) {
    return { configured: true, balances: [] };
  }

  // Build set of supported currency codes from gateway_config
  const supportedCurrencies = new Set<string>();
  for (const t of tokens) {
    const config = t.gateway_config as { currency?: string } | null;
    if (config?.currency) {
      supportedCurrencies.add(config.currency.toLowerCase());
    }
  }

  const allBalances = await nowpayments.getBalance();

  const balances: NowPaymentsBalanceItem[] = [];
  for (const [currency, data] of Object.entries(allBalances)) {
    if (supportedCurrencies.has(currency.toLowerCase())) {
      balances.push({
        currency: currency.toUpperCase(),
        amount: data.amount,
        pendingAmount: data.pendingAmount,
      });
    }
  }

  return { configured: true, balances };
}

async function fetchPrices(): Promise<Record<string, number>> {
  const supabase = createAdminClient();

  // Get unique coingecko IDs from token_deployments → base_tokens
  const { data: tokens, error } = await supabase
    .from('token_deployments')
    .select('symbol, base_tokens ( coingecko_id )')
    .eq('is_active', true);

  if (error || !tokens || tokens.length === 0) {
    return {};
  }

  // Build symbol → coingecko_id mapping, deduplicating by symbol
  const symbolToGeckoId: Record<string, string> = {};
  for (const t of tokens) {
    const baseToken = t.base_tokens as unknown as { coingecko_id: string | null } | null;
    const geckoId = baseToken?.coingecko_id;
    if (geckoId) {
      symbolToGeckoId[t.symbol.toUpperCase()] = geckoId;
    }
  }

  const uniqueGeckoIds = [...new Set(Object.values(symbolToGeckoId))];
  if (uniqueGeckoIds.length === 0) return {};

  const ids = uniqueGeckoIds.join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error(`CoinGecko API returned ${res.status}`);
  }

  const json = await res.json();

  // Map CoinGecko response back to uppercase currency symbols
  const prices: Record<string, number> = {};
  for (const [symbol, geckoId] of Object.entries(symbolToGeckoId)) {
    const price = json[geckoId]?.usd;
    if (price != null) {
      prices[symbol] = price;
    }
  }

  return prices;
}

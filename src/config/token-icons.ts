// src/config/token-icons.ts

/**
 * Base directory for crypto icons.
 */
const ICON_BASE = "/icons/crypto";

/**
 * List of available token symbols and their matching SVG filenames.
 * This avoids duplicates and keeps the tokens strongly typed.
 */
export const tokenIcons: Record<string, string> = {
  ape: `${ICON_BASE}/ape.svg`,
  bch: `${ICON_BASE}/bch.svg`,
  bnb: `${ICON_BASE}/bnb.svg`,
  btc: `${ICON_BASE}/btc.svg`,
  btt: `${ICON_BASE}/btt.svg`,
  busd: `${ICON_BASE}/busd.svg`,
  dash: `${ICON_BASE}/dash.svg`,
  default: `${ICON_BASE}/default.svg`,
  doge: `${ICON_BASE}/doge.svg`,
  dot: `${ICON_BASE}/dot.svg`,
  etc: `${ICON_BASE}/etc.svg`,
  eth: `${ICON_BASE}/eth.svg`,
  ltc: `${ICON_BASE}/ltc.svg`,
  matic: `${ICON_BASE}/matic.svg`,
  shib: `${ICON_BASE}/shib.svg`,
  sol: `${ICON_BASE}/sol.svg`,
  ton: `${ICON_BASE}/ton.svg`,
  trx: `${ICON_BASE}/trx.svg`,
  usdc: `${ICON_BASE}/usdc.svg`,
  usdt: `${ICON_BASE}/usdt.svg`,
  xmr: `${ICON_BASE}/xmr.svg`,
  xrp: `${ICON_BASE}/xrp.svg`,
  zec: `${ICON_BASE}/zec.svg`,
  // Add more tokens here — no duplicates needed
};

/**
 * An array of available icon paths.
 */
export const tokenIconPaths: string[] = Object.values(tokenIcons);

/**
 * Fast lookup Set of paths.
 */
export const tokenIconSet: Set<string> = new Set(tokenIconPaths);

/**
 * Returns the icon path for a token symbol.
 * Supports both base tokens (USDT, BTC) and deployment symbols (USDT_TRX, BTC_BEP20).
 * Falls back to default.svg if the token icon does not exist.
 *
 * @param symbol - Token symbol (e.g., "USDT", "USDT_TRX", "BTC_BEP20")
 * @returns Icon path for the token
 */
export function getTokenIcon(symbol: string): string {
  if (!symbol) return tokenIcons.default;

  const key = symbol.toLowerCase();

  // Try exact match first (handles base tokens and known deployments)
  if (tokenIcons[key]) {
    return tokenIcons[key];
  }

  // Extract base token from deployment symbol (USDT_TRX → USDT)
  // Pattern: {BASE_TOKEN}_{NETWORK_IDENTIFIER}
  // Examples: USDT_TRX → USDT, BTC_BEP20 → BTC, ETH_MATIC → ETH
  const baseSymbol = key.split('_')[0];
  if (baseSymbol && tokenIcons[baseSymbol]) {
    return tokenIcons[baseSymbol];
  }

  // Fallback to default
  return tokenIcons.default;
}

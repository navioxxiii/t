/**
 * NOWPayments Configuration Constants
 * Centralized configuration for NOWPayments integration
 */

/**
 * Map coin symbols to NOWPayments currency codes
 * NOWPayments uses lowercase currency codes
 */
export const NOWPAYMENTS_CURRENCY_MAP: Record<string, string> = {
  // Native coins initially supported via NOWPayments
  SOL: 'sol',
  XRP: 'xrp',
  ADA: 'ada',

  // Additional coins that could be added later
  // BTC: 'btc',
  // ETH: 'eth',
  // DOGE: 'doge',
  // LTC: 'ltc',
} as const;

/**
 * Get NOWPayments currency code for a coin symbol
 * @throws Error if coin not supported
 */
export function getNowPaymentsCurrency(coinSymbol: string): string {
  const currency = NOWPAYMENTS_CURRENCY_MAP[coinSymbol.toUpperCase()];
  if (!currency) {
    throw new Error(`Unsupported coin for NOWPayments: ${coinSymbol}`);
  }
  return currency;
}

/**
 * Check if coin is supported by NOWPayments
 */
export function isNowPaymentsSupported(coinSymbol: string): boolean {
  return coinSymbol.toUpperCase() in NOWPAYMENTS_CURRENCY_MAP;
}

/**
 * Currencies that require extra_id (memo/tag) for deposits
 * These networks use shared addresses with destination tags
 */
export const CURRENCIES_REQUIRING_MEMO: string[] = [
  'xrp', // XRP requires destination tag
  'xlm', // Stellar requires memo
  'eos', // EOS requires memo
  'bnb', // BNB (Beacon Chain) requires memo
  'atom', // Cosmos requires memo
];

/**
 * Check if currency requires a memo/tag for deposits
 */
export function requiresMemo(currency: string): boolean {
  return CURRENCIES_REQUIRING_MEMO.includes(currency.toLowerCase());
}

/**
 * Currencies that require invoice-style deposits (new payment per deposit)
 * These cannot reuse addresses because the memo/tag is tied to a specific payment.
 * For these currencies, users must create a new deposit request each time.
 */
export const INVOICE_REQUIRED_CURRENCIES: string[] = [
  'xrp', // XRP - address+tag combo cannot be reused
  'xlm', // Stellar - same limitation
  // Note: eos, bnb, atom may also need this - add as needed
];

/**
 * Check if currency requires invoice-style deposits
 * If true, users cannot have a permanent address and must create a new
 * deposit payment each time they want to deposit.
 */
export function requiresInvoiceFlow(currency: string): boolean {
  return INVOICE_REQUIRED_CURRENCIES.includes(currency.toLowerCase());
}

/**
 * NOWPayments fee structure (for documentation purposes)
 *
 * Custody mode:
 * - Deposit fee: 0.5%
 * - Withdrawal fee: 0% (only network fee applies)
 *
 * Non-custody mode:
 * - Service fee: 0.5%
 * - Auto-conversion fee: +0.5% if converting to different currency
 */
export const NOWPAYMENTS_FEES = {
  CUSTODY_DEPOSIT_PERCENT: 0.5,
  CUSTODY_WITHDRAWAL_PERCENT: 0,
  SERVICE_FEE_PERCENT: 0.5,
  CONVERSION_FEE_PERCENT: 0.5,
} as const;

/**
 * Default IPN callback URL path
 * Used when generating webhook URLs for NOWPayments
 */
export const NOWPAYMENTS_WEBHOOK_PATH = '/api/webhooks/nowpayments';

/**
 * Get full webhook URL for NOWPayments callbacks
 */
export function getWebhookUrl(baseUrl: string): string {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}${NOWPAYMENTS_WEBHOOK_PATH}`;
}

/**
 * Minimum deposit amounts in USD (approximate)
 * These are rough estimates; actual minimums depend on network fees
 */
export const MINIMUM_DEPOSITS_USD: Record<string, number> = {
  sol: 0.5,
  xrp: 1,
  ada: 1,
} as const;

/**
 * Payment expiry time in minutes
 * NOWPayments payments typically expire after 20-60 minutes
 * For permanent addresses, this is less relevant as subsequent deposits work
 */
export const PAYMENT_EXPIRY_MINUTES = 60;

/**
 * API rate limits (requests per second)
 * NOWPayments has reasonable rate limits for API access
 */
export const API_RATE_LIMITS = {
  REQUESTS_PER_SECOND: 10,
  REQUESTS_PER_MINUTE: 200,
} as const;

/**
 * Format a price (USD) with smart decimal precision
 * - Prices >= $1.00: 2 decimals
 * - Prices >= $0.01 and < $1.00: 4 decimals
 * - Prices < $0.01: Dynamic decimals to show first 2 significant digits (max 8)
 *
 * @param price The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (price >= 1.0) {
    // Regular prices: 2 decimals
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  if (price >= 0.01) {
    // Small prices (cents): 4 decimals
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(price);
  }

  // Very small prices: calculate needed decimals for 2 significant digits
  if (price === 0) {
    return "$0.00";
  }

  // Find number of decimals needed to show first 2 significant digits
  const decimalsNeeded = Math.max(
    2,
    Math.ceil(-Math.log10(price)) + 1
  );

  // Cap at 8 decimals to prevent extreme cases
  const maxDecimals = Math.min(decimalsNeeded, 8);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(price);
}

/**
 * Format a number as USD currency
 *
 * @param amount The amount to format
 * @param options Formatting options
 * @param options.compact Use compact notation (K, M) for large numbers
 * @param options.isPrice Use smart decimal precision for prices (recommended for per-unit prices)
 *   - Prices >= $1.00: 2 decimals
 *   - Prices >= $0.01 and < $1.00: 4 decimals
 *   - Prices < $0.01: Dynamic decimals to show significant digits (max 8)
 * @param options.maximumFractionDigits Override max decimals (ignored if isPrice=true)
 * @param options.minimumFractionDigits Override min decimals (ignored if isPrice=true)
 * @returns Formatted currency string
 *
 * @example
 * formatUSD(1234.56) // "$1,234.56"
 * formatUSD(0.000123, { isPrice: true }) // "$0.00012"
 * formatUSD(1000000, { compact: true }) // "$1.00M"
 */
export function formatUSD(
  amount: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
    isPrice?: boolean;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
    isPrice = false,
  } = options;

  // If this is a price (not a balance/total), use formatPrice()
  if (isPrice) {
    return formatPrice(amount);
  }

  if (compact && amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }

  if (compact && amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format cryptocurrency amount with proper decimal places
 * @param amount The crypto amount
 * @param symbol The coin symbol (for determining decimals)
 * @returns Formatted crypto amount
 */
export function formatCrypto(
  amount: number,
  symbol: string,
  options: {
    maximumFractionDigits?: number;
  } = {}
): string {
  // Default decimal places based on coin type
  const defaultDecimals: Record<string, number> = {
    BTC: 8,
    ETH: 6,
    LTC: 8,
    DOGE: 2,
    TRX: 2,
    USDT: 2,
  };

  const maxDecimals =
    options.maximumFractionDigits ??
    defaultDecimals[symbol] ??
    6;

  // For very small amounts, show more decimals
  if (amount > 0 && amount < 0.01) {
    return amount.toFixed(8).replace(/\.?0+$/, '');
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}

/**
 * Format a price change amount with + or - sign
 * @param change The change amount
 * @param isPercentage Whether this is a percentage value
 * @returns Formatted change string
 */
export function formatChange(
  change: number,
  isPercentage: boolean = false
): string {
  const sign = change >= 0 ? '+' : '';
  const formatted = isPercentage
    ? change.toFixed(2)
    : formatUSD(Math.abs(change), { minimumFractionDigits: 2 });

  if (isPercentage) {
    return `${sign}${formatted}%`;
  }

  return change >= 0 ? `${sign}${formatted}` : `-${formatted}`;
}

/**
 * Get color class for price change
 * @param change The change amount
 * @returns Tailwind color class
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-600 dark:text-green-400';
  if (change < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Get background color class for change badge
 * @param change The change amount
 * @returns Tailwind background color class
 */
export function getChangeBgColor(change: number): string {
  if (change > 0) return 'bg-green-100 dark:bg-green-900/30';
  if (change < 0) return 'bg-red-100 dark:bg-red-900/30';
  return 'bg-gray-100 dark:bg-gray-800';
}

/**
 * Shorten wallet address for display
 * @param address The full wallet address
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a number with compact notation (K, M, B)
 * @param num The number to format
 * @returns Formatted string
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Parse a user input amount string to number
 * Handles comma separators and validates format
 * @param input The input string
 * @returns Parsed number or null if invalid
 */
export function parseAmountInput(input: string): number | null {
  // Remove whitespace and commas
  const cleaned = input.replace(/[\s,]/g, '');

  // Check if valid number format
  if (!/^\d*\.?\d*$/.test(cleaned)) {
    return null;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

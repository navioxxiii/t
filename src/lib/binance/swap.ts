import { fetchCoinPrices } from './client';

// Configuration
export const SWAP_FEE_PERCENTAGE = 2.5; // 2.5% fee
export const MINIMUM_SWAP_USD = 10; // $10 minimum

export interface SwapEstimate {
  fromCoin: string;
  toCoin: string;
  fromAmount: number;
  toAmount: number;
  fromPrice: number;
  toPrice: number;
  rate: number;
  feePercentage: number;
  feeAmount: number;
  totalUsdValue: number;
  estimatedAt: string;
  isHighPriority: boolean;
}

export interface SwapValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Calculate swap estimate with fee
 * @param fromCoin Source coin symbol
 * @param toCoin Destination coin symbol
 * @param fromAmount Amount of source coin to swap
 * @returns Swap estimate with all details
 */
export async function calculateSwapEstimate(
  fromCoin: string,
  toCoin: string,
  fromAmount: number
): Promise<SwapEstimate | null> {
  try {
    // Validate input amount
    if (!fromAmount || fromAmount <= 0 || !isFinite(fromAmount)) {
      console.error('Invalid fromAmount:', fromAmount);
      return null;
    }

    // Fetch current prices for both coins
    const pricesMap = await fetchCoinPrices([fromCoin, toCoin]);
    const fromPrice = pricesMap.get(fromCoin);
    const toPrice = pricesMap.get(toCoin);

    if (!fromPrice || !toPrice) {
      console.error('Failed to fetch prices for swap estimation');
      return null;
    }

    // Validate prices are valid numbers > 0
    if (
      !fromPrice.current_price ||
      !toPrice.current_price ||
      fromPrice.current_price <= 0 ||
      toPrice.current_price <= 0 ||
      !isFinite(fromPrice.current_price) ||
      !isFinite(toPrice.current_price)
    ) {
      console.error('Invalid prices:', {
        fromPrice: fromPrice.current_price,
        toPrice: toPrice.current_price,
      });
      return null;
    }

    // Calculate USD value of input amount
    const usdValue = fromAmount * fromPrice.current_price;

    // Validate USD value
    if (!isFinite(usdValue) || usdValue <= 0) {
      console.error('Invalid USD value:', usdValue);
      return null;
    }

    // Calculate fee amount (in USD)
    const feeAmount = usdValue * (SWAP_FEE_PERCENTAGE / 100);

    // Calculate USD value after fee
    const usdValueAfterFee = usdValue - feeAmount;

    // Calculate output amount
    const toAmount = usdValueAfterFee / toPrice.current_price;

    // Validate output amount
    if (!isFinite(toAmount) || toAmount <= 0) {
      console.error('Invalid toAmount:', toAmount);
      return null;
    }

    // Calculate exchange rate (how many toCoin per 1 fromCoin after fees)
    const rate = toAmount / fromAmount;

    // Validate rate
    if (!isFinite(rate) || rate <= 0) {
      console.error('Invalid exchange rate:', rate);
      return null;
    }

    return {
      fromCoin,
      toCoin,
      fromAmount,
      toAmount,
      fromPrice: fromPrice.current_price,
      toPrice: toPrice.current_price,
      rate,
      feePercentage: SWAP_FEE_PERCENTAGE,
      feeAmount,
      totalUsdValue: usdValue,
      estimatedAt: new Date().toISOString(),
      isHighPriority: true,
    };
  } catch (error) {
    console.error('Error calculating swap estimate:', error);
    return null;
  }
}

/**
 * Validate swap request
 * @param fromCoin Source coin symbol
 * @param toCoin Destination coin symbol
 * @param fromAmount Amount of source coin to swap
 * @param userBalance User's balance of source coin
 * @returns Validation result
 */
export async function validateSwap(
  fromCoin: string,
  toCoin: string,
  fromAmount: number,
  userBalance: number
): Promise<SwapValidation> {
  // Check if coins are the same
  if (fromCoin === toCoin) {
    return {
      isValid: false,
      error: 'Cannot swap a coin to itself',
    };
  }

  // Check if amount is positive
  if (fromAmount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero',
    };
  }

  // Check if user has sufficient balance
  if (fromAmount > userBalance) {
    return {
      isValid: false,
      error: 'Insufficient balance',
    };
  }

  // Fetch price to check USD value
  const pricesMap = await fetchCoinPrices([fromCoin]);
  const fromPrice = pricesMap.get(fromCoin);

  if (!fromPrice) {
    return {
      isValid: false,
      error: 'Unable to fetch price data',
    };
  }

  // Check minimum USD value
  const usdValue = fromAmount * fromPrice.current_price;
  if (usdValue < MINIMUM_SWAP_USD) {
    return {
      isValid: false,
      error: `Minimum swap amount is $${MINIMUM_SWAP_USD} USD (${(MINIMUM_SWAP_USD / fromPrice.current_price).toFixed(8)} ${fromCoin})`,
    };
  }

  return { isValid: true };
}

/**
 * Format swap details for transaction record
 */
export function formatSwapTransaction(estimate: SwapEstimate) {
  return {
    swap_from_coin: estimate.fromCoin,
    swap_to_coin: estimate.toCoin,
    swap_from_amount: estimate.fromAmount,
    swap_to_amount: estimate.toAmount,
    swap_rate: estimate.rate,
    swap_fee_percentage: estimate.feePercentage,
  };
}

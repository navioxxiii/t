/**
 * NOWPayments Integration Module
 *
 * This module provides integration with the NOWPayments API for:
 * - Creating deposit addresses (SOL, XRP, ADA)
 * - Processing payouts/withdrawals
 * - Verifying webhook signatures
 *
 * Usage:
 * ```typescript
 * import { nowpayments } from '@/lib/nowpayments';
 *
 * // Create deposit address
 * const { address } = await nowpayments.createDepositAddress('sol', userId);
 *
 * // Withdraw crypto
 * const payout = await nowpayments.withdraw('sol', destinationAddress, amount);
 * ```
 */

// Client
export { NowPaymentsClient, nowpayments } from './client';

// Types
export type {
  NowPaymentsStatusResponse,
  NowPaymentsCurrenciesResponse,
  NowPaymentsMinAmountResponse,
  NowPaymentsEstimateParams,
  NowPaymentsEstimateResponse,
  CreatePaymentParams,
  NowPaymentsPaymentResponse,
  NowPaymentsPaymentStatusResponse,
  PaymentStatus,
  CreateInvoiceParams,
  NowPaymentsInvoiceResponse,
  NowPaymentsAuthResponse,
  PayoutWithdrawal,
  CreatePayoutParams,
  NowPaymentsPayoutResponse,
  PayoutWithdrawalResult,
  PayoutStatus,
  NowPaymentsIPNCallback,
  NowPaymentsPayoutIPNCallback,
  NowPaymentsErrorResponse,
  NowPaymentsBalanceResponse,
} from './types';

export { isNowPaymentsError } from './types';

// Webhook verification
export {
  verifyNowPaymentsSignature,
  validatePaymentCallback,
  validatePayoutCallback,
  mapPaymentStatus,
  mapPayoutStatus,
  isPaymentComplete,
  isPaymentPending,
  shouldCreditBalance,
} from './webhooks';

// Configuration
export {
  NOWPAYMENTS_CURRENCY_MAP,
  getNowPaymentsCurrency,
  isNowPaymentsSupported,
  CURRENCIES_REQUIRING_MEMO,
  requiresMemo,
  NOWPAYMENTS_FEES,
  NOWPAYMENTS_WEBHOOK_PATH,
  getWebhookUrl,
  MINIMUM_DEPOSITS_USD,
} from './config';

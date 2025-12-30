/**
 * NOWPayments API TypeScript Type Definitions
 * Based on official NOWPayments API documentation
 * https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

// ============================================
// API STATUS
// ============================================

export interface NowPaymentsStatusResponse {
  message: string; // "OK" when API is healthy
}

// ============================================
// CURRENCIES
// ============================================

export interface NowPaymentsCurrenciesResponse {
  currencies: string[]; // Array of supported currency codes
}

export interface NowPaymentsMinAmountResponse {
  currency_from: string;
  currency_to: string;
  min_amount: number;
  fiat_equivalent?: number;
}

// ============================================
// ESTIMATE / PRICE
// ============================================

export interface NowPaymentsEstimateParams {
  amount: number;
  currency_from: string;
  currency_to: string;
}

export interface NowPaymentsEstimateResponse {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: string;
}

// ============================================
// PAYMENT CREATION (DEPOSIT ADDRESS)
// ============================================

export interface CreatePaymentParams {
  price_amount: number; // Amount in price_currency (can be 0 for any amount)
  price_currency: string; // Fiat or crypto currency code (e.g., 'usd', 'btc')
  pay_currency: string; // Currency customer will pay with (e.g., 'sol', 'xrp')
  order_id?: string; // Your internal order/user identifier
  order_description?: string; // Description for reference
  ipn_callback_url?: string; // Webhook URL for payment notifications
  success_url?: string; // Redirect URL on successful payment
  cancel_url?: string; // Redirect URL on cancelled payment
  partially_paid_url?: string; // Redirect URL on partial payment
  is_fixed_rate?: boolean; // Lock exchange rate
  is_fee_paid_by_user?: boolean; // User pays network fee
  case?: 'success' | 'fail'; // For sandbox testing
}

export interface NowPaymentsPaymentResponse {
  payment_id: string; // Unique payment identifier
  payment_status: PaymentStatus;
  pay_address: string; // THE DEPOSIT ADDRESS - most important!
  payin_extra_id?: string | null; // Memo/destination tag for XRP, XLM, etc.
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  amount_received: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string; // ISO date string
  updated_at: string;
  purchase_id: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  burning_percent?: number;
  expiration_estimate_date?: string;
}

// ============================================
// PAYMENT STATUS
// ============================================

export type PaymentStatus =
  | 'waiting' // Waiting for customer to send payment
  | 'confirming' // Payment detected, waiting for confirmations
  | 'confirmed' // Payment confirmed on blockchain
  | 'sending' // Sending funds to merchant wallet (non-custody)
  | 'partially_paid' // Customer sent less than required
  | 'finished' // Payment completed successfully
  | 'failed' // Payment failed
  | 'refunded' // Payment refunded
  | 'expired'; // Payment expired (not paid within time limit)

export interface NowPaymentsPaymentStatusResponse {
  payment_id: number;
  invoice_id: number | null;
  payment_status: PaymentStatus;
  pay_address: string;
  payin_extra_id: string | null; // Memo/tag for XRP, etc.
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number; // Actual amount received
  actually_paid_at_fiat: number;
  pay_currency: string;
  order_id: string | null;
  order_description: string | null;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  payout_hash: string | null; // Transaction hash
  payin_hash: string | null; // Incoming transaction hash
  created_at: string;
  updated_at: string;
  burning_percent: number | null;
  type: string;
}

// ============================================
// INVOICE CREATION
// ============================================

export interface CreateInvoiceParams {
  price_amount: number;
  price_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
  partially_paid_url?: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
}

export interface NowPaymentsInvoiceResponse {
  id: string;
  token_id: string;
  order_id: string | null;
  order_description: string | null;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string | null;
  invoice_url: string; // URL for customer payment page
  success_url: string | null;
  cancel_url: string | null;
  partially_paid_url: string | null;
  payout_currency: string | null;
  created_at: string;
  updated_at: string;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
}

// ============================================
// PAYOUT / WITHDRAWAL
// ============================================

export interface NowPaymentsAuthResponse {
  token: string; // JWT token for payout requests
}

export interface PayoutWithdrawal {
  address: string; // Destination wallet address
  currency: string; // Currency code (e.g., 'sol', 'xrp')
  amount: number; // Amount to send
  ipn_callback_url?: string; // Webhook for payout status
  extra_id?: string; // Memo/tag for currencies that require it (XRP, etc.)
  fiat_amount?: number; // Amount in fiat
  fiat_currency?: string; // Fiat currency code
}

export interface CreatePayoutParams {
  ipn_callback_url?: string;
  withdrawals: PayoutWithdrawal[];
}

export interface NowPaymentsPayoutResponse {
  id: string; // Payout batch ID
  withdrawals: PayoutWithdrawalResult[];
}

export interface PayoutWithdrawalResult {
  id: string; // Individual withdrawal ID
  address: string;
  currency: string;
  amount: number;
  status: PayoutStatus;
  batch_withdrawal_id: string;
  extra_id?: string;
  hash?: string; // Transaction hash (when completed)
  error?: string;
  created_at: string;
  updated_at: string;
}

export type PayoutStatus =
  | 'WAITING' // Waiting to be processed
  | 'PENDING' // Being processed
  | 'SENDING' // Transaction submitted to blockchain
  | 'FINISHED' // Payout completed
  | 'FAILED' // Payout failed
  | 'REJECTED' // Payout rejected
  | 'EXPIRED'; // Payout expired

// ============================================
// IPN CALLBACK (WEBHOOK)
// ============================================

export interface NowPaymentsIPNCallback {
  payment_id: number;
  invoice_id?: number | null;
  payment_status: PaymentStatus;
  pay_address: string;
  payin_extra_id?: string | null;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  actually_paid_at_fiat?: number;
  pay_currency: string;
  order_id?: string | null;
  order_description?: string | null;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payout_hash?: string | null;
  payin_hash?: string | null;
  created_at: string;
  updated_at: string;
  burning_percent?: number | null;
  type?: string;
}

// ============================================
// PAYOUT IPN CALLBACK
// ============================================

export interface NowPaymentsPayoutIPNCallback {
  id: string;
  address: string;
  currency: string;
  amount: number;
  status: PayoutStatus;
  batch_withdrawal_id: string;
  extra_id?: string;
  hash?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  ipn_callback_url?: string;
}

// ============================================
// ERROR RESPONSE
// ============================================

export interface NowPaymentsErrorResponse {
  statusCode: number;
  code: string;
  message: string;
}

// ============================================
// BALANCE (CUSTODY)
// ============================================

export interface NowPaymentsBalanceResponse {
  [currency: string]: {
    amount: string;
    pendingAmount: string;
  };
}

// ============================================
// HELPER TYPES
// ============================================

export type NowPaymentsResponse<T> = T | NowPaymentsErrorResponse;

export function isNowPaymentsError(
  response: unknown
): response is NowPaymentsErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'statusCode' in response &&
    'code' in response
  );
}

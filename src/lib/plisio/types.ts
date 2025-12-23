/**
 * Plisio API TypeScript Type Definitions
 * Based on official Plisio API documentation
 */

// ============================================
// DEPOSIT / PERMANENT ADDRESS GENERATION
// ============================================

export interface PlisioDepositResponse {
  status: 'success' | 'error';
  data: {
    uid: string;                        // Your internal user identifier
    hash: string;                       // Permanent deposit address (never expires!)
    psys_cid: string;                   // Cryptocurrency ID
  };
}

// ============================================
// INVOICE / ADDRESS GENERATION (Legacy/Send Feature)
// ============================================

export interface PlisioInvoiceResponse {
  status: 'success' | 'error';
  data: {
    txn_id: string;                    // Unique transaction ID
    invoice_url: string;                // Payment page URL (optional for us)
    amount?: string;                    // Invoice amount
    pending_amount?: string;            // Amount pending confirmation
    wallet_hash?: string;               // THE PERMANENT ADDRESS! (most important)
    psys_cid?: string;                  // Plisio currency ID (BTC, ETH, etc.)
    currency?: string;                  // Same as psys_cid
    status?: 'new' | 'pending' | 'completed' | 'error';
    source_currency?: string;           // If converting from fiat
    source_rate?: string;               // Exchange rate
    expire_utc?: number;                // Expiration timestamp (we ignore this)
    expected_confirmations?: string;    // Blockchain confirmations needed
    qr_code?: string;                   // QR code image URL (FREE!)
    verify_hash?: string;               // For webhook signature verification
    invoice_commission?: string;        // Plisio's fee
    invoice_sum?: string;               // Total amount
    invoice_total_sum?: string;         // Amount + fees
  };
}

// Detailed invoice response from /invoices/{txn_id} endpoint
export interface PlisioInvoiceDetailsResponse {
  status: 'success' | 'error';
  data: {
    invoice: {
      txn_id: string;
      invoice_url: string;
      invoice_total_sum: string;
      id: string;
      status: 'new' | 'pending' | 'completed' | 'error';
      type: 'invoice';
      status_code: number;
      amount: string;
      received_amount: string;
      pending_amount: string;
      remaining_amount: string;
      wallet_hash: string;              // ALWAYS present in detailed response
      psys_cid: string;
      currency: string;
      source_currency: string;
      source_rate: string;
      expected_confirmations: number;
      created_utc: number;
      created_at_utc: number;
      expire_utc: string;
      expire_at_utc: string;
      invoice_commission: string;
      invoice_sum: string;
      qr_url: string;                   // QR code for the wallet address
      view_key: string;
      params?: Record<string, unknown>;
    };
  };
}

// ============================================
// WEBHOOK / CALLBACK DATA
// ============================================

export interface PlisioCallback {
  txn_id: string;                       // Transaction ID
  ipn_type: 'invoice' | 'pay_in';       // 'invoice' for invoices, 'pay_in' for deposits
  merchant: string;                     // Your merchant name
  merchant_id: string;                  // Your merchant ID
  amount: string;                       // Amount received
  currency: string;                     // Coin symbol (BTC, ETH, etc.)
  order_number?: string;                // Our custom order identifier (invoice only)
  order_name?: string;                  // Our custom order name (invoice only)
  deposit_uid?: string;                 // User identifier (pay_in only)
  wallet_hash?: string;                 // Deposit address (pay_in) or invoice address
  confirmations: string;                // Current blockchain confirmations
  status: 'new' | 'pending' | 'pending internal' | 'expired' | 'completed' | 'mismatch' | 'error' | 'cancelled';
  source_currency?: string;
  source_amount?: string;
  source_rate?: string;
  comment?: string;
  verify_hash: string;                  // CRITICAL: For security verification
  invoice_commission: string;
  invoice_sum: string;
  invoice_total_sum: string;
  deposit_sum?: string;                 // For pay_in callbacks
  psys_cid?: string;
  pending_amount?: string;
  qr_code?: string;
  tx_urls?: string | string[];          // Blockchain explorer links
}

// ============================================
// WITHDRAWAL / SEND CRYPTO
// ============================================

export interface PlisioWithdrawalRequest {
  psys_cid: string;                     // Currency ID (BTC, ETH, etc.)
  to: string;                           // Destination address
  amount: string;                       // Amount to send
  feePlan?: 'normal' | 'priority';      // Fee priority (default: normal)
  type?: 'cash_out' | 'mass_cash_out';  // Single or bulk withdrawal
}

export interface PlisioWithdrawalResponse {
  status: 'success' | 'error';
  data: {
    type: 'cash_out' | 'mass_cash_out';
    status: 'completed' | 'error' | 'pending';
    psys_cid: string;
    currency: string;
    source_currency: string;
    source_rate: string;
    fee: string;                        // Network fee charged
    wallet_hash?: string;               // Destination address (single withdrawal)
    sendmany?: Record<string, string>;  // Multiple addresses (mass withdrawal)
    params: {
      fee: {
        conf_target?: number;
        plan: string;
        value: string;
      };
    };
    created_at_utc: number;
    amount: string;
    tx_url: string;                     // Blockchain explorer link
    id: string;                         // Withdrawal transaction ID
  };
}

// ============================================
// BALANCE CHECK
// ============================================

export interface PlisioBalanceResponse {
  status: 'success' | 'error';
  data: {
    psys_cid: string;                   // Currency ID
    currency: string;                   // Currency symbol
    balance: string;                    // Your Plisio account balance for this coin
  };
}

// ============================================
// ERROR RESPONSES
// ============================================

export interface PlisioErrorResponse {
  status: 'error';
  data: {
    name: string;                       // Error name
    message: string;                    // Error description
    code: number;                       // Error code
  };
}

// ============================================
// HELPER TYPES
// ============================================

export type PlisioResponse<T> = T | PlisioErrorResponse;

export interface CreateInvoiceParams {
  currency: string;                     // Plisio currency ID (psys_cid)
  order_name: string;                   // Custom identifier for your records
  order_number: string;                 // Unique order number
  amount?: string;                      // Payment amount (use '0' to just generate address)
  source_currency?: string;             // For fiat conversion
  source_amount?: string;               // Fiat amount
  allowed_psys_cids?: string[];         // Restrict payment methods
  description?: string;                 // Invoice description
  callback_url?: string;                // Webhook URL (IMPORTANT!)
  email?: string;                       // Customer email
  language?: string;                    // Invoice page language
  plugin?: string;                      // Platform identifier
  version?: string;                     // Plugin version
  redirect_to_invoice?: boolean;        // Auto-redirect after payment
  expire_min?: number;                  // Expiration time in minutes
}

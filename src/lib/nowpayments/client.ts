/**
 * NOWPayments API Client
 * Wrapper for NOWPayments REST API with type safety
 *
 * API Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

import type {
  NowPaymentsStatusResponse,
  NowPaymentsCurrenciesResponse,
  NowPaymentsMinAmountResponse,
  NowPaymentsEstimateParams,
  NowPaymentsEstimateResponse,
  CreatePaymentParams,
  NowPaymentsPaymentResponse,
  NowPaymentsPaymentStatusResponse,
  NowPaymentsAuthResponse,
  CreatePayoutParams,
  NowPaymentsPayoutResponse,
  NowPaymentsBalanceResponse,
  NowPaymentsErrorResponse,
} from './types';

const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1';

/**
 * NOWPayments API Client Class
 * Supports both standard payments and custody payouts
 */
export class NowPaymentsClient {
  private baseUrl = NOWPAYMENTS_API_BASE;
  private apiKey: string;
  private ipnSecretKey: string;
  private email: string;
  private password: string;
  private jwtToken: string | null = null;
  private jwtExpiry: number = 0;

  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY!;
    this.ipnSecretKey = process.env.NOWPAYMENTS_IPN_SECRET!;
    this.email = process.env.NOWPAYMENTS_EMAIL!;
    this.password = process.env.NOWPAYMENTS_PASSWORD!;

    if (!this.apiKey) {
      console.warn('NOWPAYMENTS_API_KEY not configured');
    }
  }

  /**
   * Make a GET request to NOWPayments API
   */
  private async get<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    requiresAuth = false
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
    };

    if (requiresAuth) {
      const token = await this.getAuthToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request to NOWPayments API
   */
  private async post<T>(
    endpoint: string,
    body: Record<string, unknown>,
    requiresAuth = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };

    if (requiresAuth) {
      const token = await this.getAuthToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const error = data as NowPaymentsErrorResponse;
      throw new Error(
        `NOWPayments API Error: ${error.message || 'Unknown error'} (${error.code || response.status})`
      );
    }

    return data as T;
  }

  /**
   * Get JWT authentication token for payout operations
   * Tokens are cached and refreshed when expired
   */
  private async getAuthToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    const now = Date.now();
    if (this.jwtToken && this.jwtExpiry > now + 5 * 60 * 1000) {
      return this.jwtToken;
    }

    if (!this.email || !this.password) {
      throw new Error(
        'NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD required for payout operations'
      );
    }

    const response = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    });

    const data = await this.handleResponse<NowPaymentsAuthResponse>(response);

    this.jwtToken = data.token;
    // JWT tokens typically expire in 24 hours, we'll refresh after 23 hours
    this.jwtExpiry = now + 23 * 60 * 60 * 1000;

    return this.jwtToken;
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  /**
   * Check API Status
   * Use to verify API is operational
   */
  async getStatus(): Promise<NowPaymentsStatusResponse> {
    return this.get<NowPaymentsStatusResponse>('/status');
  }

  /**
   * Get Available Currencies
   * Returns list of all supported cryptocurrency codes
   */
  async getCurrencies(): Promise<NowPaymentsCurrenciesResponse> {
    return this.get<NowPaymentsCurrenciesResponse>('/currencies');
  }

  /**
   * Get Minimum Payment Amount
   * Returns minimum amount that can be accepted for a currency pair
   *
   * @param currencyFrom Source currency (fiat or crypto)
   * @param currencyTo Payment currency (crypto)
   */
  async getMinimumAmount(
    currencyFrom: string,
    currencyTo: string
  ): Promise<NowPaymentsMinAmountResponse> {
    return this.get<NowPaymentsMinAmountResponse>('/min-amount', {
      currency_from: currencyFrom.toLowerCase(),
      currency_to: currencyTo.toLowerCase(),
    });
  }

  /**
   * Get Price Estimate
   * Estimate amount to receive for a given payment
   *
   * @param params Estimate parameters
   */
  async getEstimate(
    params: NowPaymentsEstimateParams
  ): Promise<NowPaymentsEstimateResponse> {
    return this.get<NowPaymentsEstimateResponse>('/estimate', {
      amount: params.amount,
      currency_from: params.currency_from.toLowerCase(),
      currency_to: params.currency_to.toLowerCase(),
    });
  }

  /**
   * Create Payment (Generate Deposit Address)
   * Creates a new payment and returns a deposit address
   *
   * For permanent deposit addresses (like Plisio):
   * - Set price_amount to a small value (e.g., 0.01)
   * - Subsequent deposits to the same address will be tracked
   *
   * @param params Payment parameters
   * @returns Payment data including pay_address (the deposit address)
   */
  async createPayment(
    params: CreatePaymentParams
  ): Promise<NowPaymentsPaymentResponse> {
    const body: Record<string, unknown> = {
      price_amount: params.price_amount,
      price_currency: params.price_currency.toLowerCase(),
      pay_currency: params.pay_currency.toLowerCase(),
    };

    if (params.order_id) body.order_id = params.order_id;
    if (params.order_description) body.order_description = params.order_description;
    if (params.ipn_callback_url) body.ipn_callback_url = params.ipn_callback_url;
    if (params.success_url) body.success_url = params.success_url;
    if (params.cancel_url) body.cancel_url = params.cancel_url;
    if (params.partially_paid_url) body.partially_paid_url = params.partially_paid_url;
    if (params.is_fixed_rate !== undefined) body.is_fixed_rate = params.is_fixed_rate;
    if (params.is_fee_paid_by_user !== undefined)
      body.is_fee_paid_by_user = params.is_fee_paid_by_user;
    if (params.case) body.case = params.case; // For sandbox testing

    return this.post<NowPaymentsPaymentResponse>('/payment', body);
  }

  /**
   * Get Payment Status
   * Check the current status of a payment
   *
   * @param paymentId Payment ID from createPayment
   */
  async getPaymentStatus(
    paymentId: string
  ): Promise<NowPaymentsPaymentStatusResponse> {
    return this.get<NowPaymentsPaymentStatusResponse>(`/payment/${paymentId}`);
  }

  /**
   * List Payments
   * Get paginated list of all payments
   *
   * @param limit Number of results (default 10, max 500)
   * @param page Page number (0-indexed)
   * @param sortBy Field to sort by
   * @param orderBy Sort direction
   * @param dateFrom Start date filter
   * @param dateTo End date filter
   */
  async listPayments(params?: {
    limit?: number;
    page?: number;
    sortBy?: string;
    orderBy?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: NowPaymentsPaymentStatusResponse[]; total: number }> {
    return this.get('/payment/', params);
  }

  // ============================================
  // CUSTODY PAYOUT METHODS (Require JWT Auth)
  // ============================================

  /**
   * Get Custody Balance
   * Returns balances for all currencies in custody account
   * Requires JWT authentication
   */
  async getBalance(): Promise<NowPaymentsBalanceResponse> {
    return this.get<NowPaymentsBalanceResponse>('/balance', {}, true);
  }

  /**
   * Create Payout (Withdrawal)
   * Send cryptocurrency from custody account to external addresses
   * Requires JWT authentication
   *
   * @param params Payout parameters with array of withdrawals
   */
  async createPayout(
    params: CreatePayoutParams
  ): Promise<NowPaymentsPayoutResponse> {
    const body: Record<string, unknown> = {
      withdrawals: params.withdrawals.map((w) => ({
        address: w.address,
        currency: w.currency.toLowerCase(),
        amount: w.amount,
        ...(w.extra_id && { extra_id: w.extra_id }),
        ...(w.ipn_callback_url && { ipn_callback_url: w.ipn_callback_url }),
      })),
    };

    if (params.ipn_callback_url) {
      body.ipn_callback_url = params.ipn_callback_url;
    }

    return this.post<NowPaymentsPayoutResponse>('/payout', body, true);
  }

  /**
   * Get Payout Status
   * Check the status of a payout/withdrawal
   * Requires JWT authentication
   *
   * @param payoutId Payout ID from createPayout
   */
  async getPayoutStatus(payoutId: string): Promise<NowPaymentsPayoutResponse> {
    return this.get<NowPaymentsPayoutResponse>(`/payout/${payoutId}`, {}, true);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Create a permanent deposit address for a user
   * This is the equivalent of Plisio's createDeposit method
   *
   * @param currency Currency code (e.g., 'sol', 'xrp', 'ada')
   * @param userId Your internal user identifier
   * @param callbackUrl Webhook URL for payment notifications
   */
  async createDepositAddress(
    currency: string,
    userId: string,
    callbackUrl?: string
  ): Promise<{ address: string; paymentId: string; extraId?: string }> {
    // Create a payment with minimum amount to get a deposit address
    // This address can receive multiple deposits
    const minAmount = await this.getMinimumAmount('usd', currency);

    const payment = await this.createPayment({
      price_amount: minAmount.min_amount || 0.01,
      price_currency: 'usd',
      pay_currency: currency,
      order_id: userId, // Store user ID for webhook identification
      order_description: `Deposit address for user ${userId}`,
      ipn_callback_url: callbackUrl,
      is_fixed_rate: false, // CRITICAL: Allow variable deposit amounts
    });

    return {
      address: payment.pay_address,
      paymentId: payment.payment_id,
      // For XRP, XLM, etc. - this is the destination tag/memo
      extraId: payment.payin_extra_id || undefined,
    };
  }

  /**
   * Withdraw (Send Crypto) - Single withdrawal helper
   * Simplified wrapper around createPayout for single withdrawals
   *
   * @param currency Currency code
   * @param address Destination address
   * @param amount Amount to send
   * @param extraId Memo/tag for currencies that require it (XRP, etc.)
   */
  async withdraw(
    currency: string,
    address: string,
    amount: number,
    extraId?: string
  ): Promise<NowPaymentsPayoutResponse> {
    return this.createPayout({
      withdrawals: [
        {
          currency,
          address,
          amount,
          extra_id: extraId,
        },
      ],
    });
  }
}

/**
 * Singleton instance of NOWPayments client
 * Import and use this throughout your app
 */
export const nowpayments = new NowPaymentsClient();

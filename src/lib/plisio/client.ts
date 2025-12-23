/**
 * Plisio API Client
 * Wrapper for Plisio REST API with type safety
 */

import type {
  PlisioDepositResponse,
  PlisioInvoiceResponse,
  PlisioInvoiceDetailsResponse,
  PlisioBalanceResponse,
  PlisioWithdrawalRequest,
  PlisioWithdrawalResponse,
  PlisioErrorResponse,
  CreateInvoiceParams,
} from './types';

const PLISIO_API_BASE = 'https://plisio.net/api/v1';
const SECRET_KEY = process.env.PLISIO_SECRET_KEY!;

/**
 * Plisio API Client Class
 * All methods use GET requests (Plisio's API design)
 */
export class PlisioClient {
  private baseUrl = PLISIO_API_BASE;
  private secretKey = SECRET_KEY;

  /**
   * Make a GET request to Plisio API
   * Note: Plisio uses GET for everything, params go in query string
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add API key to all requests
    url.searchParams.append('api_key', this.secretKey);

    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert arrays to comma-separated strings
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      // Check if response indicates an error
      if (data.status === 'error') {
        throw new Error(
          `Plisio API Error: ${data.data?.message || 'Unknown error'}`
        );
      }

      return data as T;
    } catch (error) {
      console.error('Plisio API request failed:', error);
      throw error;
    }
  }

  /**
   * Create Deposit Address (Generate Permanent Wallet)
   * Use this to generate permanent cryptocurrency deposit addresses for users
   * These addresses NEVER expire and can receive unlimited deposits
   *
   * @param psys_cid Plisio currency ID (e.g., 'BTC', 'ETH', 'USDT_TRX')
   * @param uid Your internal unique user identifier (max 255 characters)
   * @returns Permanent deposit address (hash field)
   */
  async createDeposit(
    psys_cid: string,
    uid: string
  ): Promise<PlisioDepositResponse> {
    return this.request<PlisioDepositResponse>('/shops/deposit/new', {
      psys_cid,
      uid,
    });
  }

  /**
   * Create Invoice (For one-time payments)
   * Use this for send feature or specific payment requests
   * Note: Invoices expire after 15min-48hrs
   *
   * @param params Invoice parameters
   * @returns Invoice data including wallet_hash (temporary address) and QR code
   */
  async createInvoice(
    params: CreateInvoiceParams
  ): Promise<PlisioInvoiceResponse> {
    return this.request<PlisioInvoiceResponse>('/invoices/new', {
      ...params,
      // Ensure callback URL includes json=true for JSON response
      callback_url: params.callback_url
        ? `${params.callback_url}${params.callback_url.includes('?') ? '&' : '?'}json=true`
        : undefined,
    });
  }

  /**
   * Get Invoice Details
   * Fetch complete invoice information including wallet_hash
   * Use this after creating an invoice to get the permanent address
   *
   * @param txn_id Transaction ID from createInvoice
   * @returns Detailed invoice data with wallet_hash
   */
  async getInvoice(txn_id: string): Promise<PlisioInvoiceDetailsResponse> {
    return this.request<PlisioInvoiceDetailsResponse>(`/invoices/${txn_id}`, {});
  }

  /**
   * Get Balance
   * Check your Plisio account balance for a specific coin
   *
   * @param psys_cid Plisio currency ID (e.g., 'BTC', 'ETH')
   * @returns Balance information
   */
  async getBalance(psys_cid: string): Promise<PlisioBalanceResponse> {
    return this.request<PlisioBalanceResponse>('/balances', {
      psys_cid,
    });
  }

  /**
   * Withdraw (Send Crypto)
   * Send cryptocurrency from your Plisio account to an external address
   *
   * @param params Withdrawal parameters
   * @returns Withdrawal transaction details
   */
  async withdraw(
    params: PlisioWithdrawalRequest
  ): Promise<PlisioWithdrawalResponse> {
    return this.request<PlisioWithdrawalResponse>('/operations/withdraw', {
      ...params,
      feePlan: params.feePlan || 'normal',
      type: params.type || 'cash_out',
    });
  }

  /**
   * Get Fee Estimate
   * Estimate network fee for a withdrawal
   *
   * @param psys_cid Currency ID
   * @param addresses Destination address(es)
   * @param amounts Amount(s) to send
   * @param feePlan Fee priority
   * @returns Fee estimate
   */
  async getFeeEstimate(
    psys_cid: string,
    addresses: string | string[],
    amounts: string | string[],
    feePlan: 'normal' | 'priority' = 'normal'
  ): Promise<unknown> {
    return this.request('/operations/fee', {
      psys_cid,
      addresses: Array.isArray(addresses) ? addresses.join(',') : addresses,
      amounts: Array.isArray(amounts) ? amounts.join(',') : amounts,
      feePlan,
    });
  }

  /**
   * Get Operation Details
   * Get details about a specific transaction/operation
   *
   * @param id Operation ID
   * @returns Operation details
   */
  async getOperation(id: string): Promise<unknown> {
    return this.request('/operations', {
      id,
    });
  }
}

/**
 * Singleton instance of Plisio client
 * Import and use this throughout your app
 */
export const plisio = new PlisioClient();

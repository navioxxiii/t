/**
 * NOWPayments Payment Gateway Adapter
 *
 * Wraps the NOWPayments client to implement the PaymentGateway interface.
 */

import { nowpayments } from '@/lib/nowpayments/client';
import { getWebhookUrl, requiresMemo } from '@/lib/nowpayments/config';
import type {
  PaymentGateway,
  CreateDepositResult,
  WithdrawParams,
  WithdrawResult,
  FeeEstimate,
} from './types';

export class NowPaymentsAdapter implements PaymentGateway {
  readonly name = 'nowpayments' as const;
  private currency: string;

  /**
   * Create a NOWPayments adapter for a specific currency
   *
   * @param currency NOWPayments currency code (e.g., 'sol', 'xrp', 'ada')
   */
  constructor(currency: string) {
    if (!currency) {
      throw new Error('NOWPayments currency is required');
    }
    this.currency = currency.toLowerCase();
  }

  /**
   * Create a deposit address via NOWPayments
   * Creates a payment with minimum amount to generate a reusable address
   */
  async createDepositAddress(
    userId: string,
    callbackUrl?: string
  ): Promise<CreateDepositResult> {
    // Get the base URL for webhooks
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';
    const webhookUrl = callbackUrl || getWebhookUrl(baseUrl);

    // Create payment to generate deposit address
    const result = await nowpayments.createDepositAddress(
      this.currency,
      userId,
      webhookUrl
    );

    return {
      address: result.address,
      isShared: false,
      isPermanent: true, // NOWPayments addresses can receive repeat deposits
      externalId: result.paymentId,
      // For XRP, XLM, etc. - this is the destination tag/memo from NOWPayments
      extraId: result.extraId,
    };
  }

  /**
   * Withdraw crypto via NOWPayments (requires custody mode)
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    try {
      const response = await nowpayments.withdraw(
        this.currency,
        params.address,
        params.amount,
        params.extraId
      );

      // Check if withdrawal was created successfully
      if (response.withdrawals && response.withdrawals.length > 0) {
        const withdrawal = response.withdrawals[0];

        return {
          success: withdrawal.status !== 'FAILED' && withdrawal.status !== 'REJECTED',
          transactionId: withdrawal.id,
          transactionHash: withdrawal.hash,
          error: withdrawal.error,
        };
      }

      return {
        success: false,
        error: 'No withdrawal created',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get minimum deposit amount from NOWPayments
   */
  async getMinimumDeposit(): Promise<number> {
    try {
      const response = await nowpayments.getMinimumAmount('usd', this.currency);
      return response.min_amount || 0.01;
    } catch (error) {
      console.error('Failed to get minimum deposit:', error);
      // Return sensible defaults per currency
      const defaults: Record<string, number> = {
        sol: 0.01,
        xrp: 10,
        ada: 1,
      };
      return defaults[this.currency] || 0.01;
    }
  }

  /**
   * Estimate withdrawal fee
   * NOWPayments custody has 0% withdrawal fee (only network fee)
   */
  async estimateFee(amount: number, address: string): Promise<FeeEstimate> {
    // NOWPayments custody mode has 0% service fee on withdrawals
    // Only network fees apply, which vary by currency

    // Approximate network fees (these are estimates)
    const networkFees: Record<string, number> = {
      sol: 0.000005, // SOL network fee is very low
      xrp: 0.00001, // XRP network fee is minimal
      ada: 0.17, // ADA has a fixed minimum fee
      btc: 0.0001, // BTC varies with congestion
      eth: 0.002, // ETH varies significantly
    };

    const fee = networkFees[this.currency] || 0.001;

    return {
      fee,
      currency: this.currency,
    };
  }

  /**
   * Check if NOWPayments is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.NOWPAYMENTS_API_KEY &&
      process.env.NOWPAYMENTS_IPN_SECRET
    );
  }
}

/**
 * Plisio Payment Gateway Adapter
 *
 * Wraps the Plisio client to implement the PaymentGateway interface.
 */

import { plisio } from '@/lib/plisio/client';
import type {
  PaymentGateway,
  CreateDepositResult,
  WithdrawParams,
  WithdrawResult,
  FeeEstimate,
} from './types';

export class PlisioAdapter implements PaymentGateway {
  readonly name = 'plisio' as const;
  private plisioCid: string;

  /**
   * Create a Plisio adapter for a specific currency
   *
   * @param plisioCid Plisio currency ID (e.g., 'BTC', 'ETH', 'USDT_TRX')
   */
  constructor(plisioCid: string) {
    if (!plisioCid) {
      throw new Error('Plisio CID is required');
    }
    this.plisioCid = plisioCid;
  }

  /**
   * Create a permanent deposit address via Plisio
   * These addresses never expire and can receive unlimited deposits
   */
  async createDepositAddress(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callbackUrl?: string
  ): Promise<CreateDepositResult> {
    // Note: Plisio callback URL is configured at the shop level, not per-deposit
    const response = await plisio.createDeposit(this.plisioCid, userId);

    return {
      address: response.data.hash,
      isShared: false,
      isPermanent: true,
      externalId: response.data.uid,
    };
  }

  /**
   * Withdraw crypto via Plisio
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    try {
      const response = await plisio.withdraw({
        psys_cid: this.plisioCid,
        to: params.address,
        amount: params.amount.toString(),
        feePlan: 'normal',
      });

      if (response.status === 'success') {
        return {
          success: true,
          transactionId: response.data.id,
          transactionHash: response.data.tx_url
            ? this.extractTxHash(response.data.tx_url)
            : undefined,
          fee: parseFloat(response.data.fee || '0'),
        };
      }

      return {
        success: false,
        error: 'Withdrawal failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get minimum deposit amount
   * Plisio has very low minimums, typically dust limits
   */
  async getMinimumDeposit(): Promise<number> {
    // Plisio minimum amounts are very low (dust limits)
    // These are approximate values per currency
    const minimums: Record<string, number> = {
      BTC: 0.00001,
      ETH: 0.0001,
      LTC: 0.001,
      DOGE: 1,
      TRX: 1,
      USDT: 1,
      USDT_TRX: 1,
      USDT_ETH: 10, // Higher due to gas fees
    };

    return minimums[this.plisioCid] || 0.001;
  }

  /**
   * Estimate withdrawal fee via Plisio
   */
  async estimateFee(amount: number, address: string): Promise<FeeEstimate> {
    try {
      const response = await plisio.getFeeEstimate(
        this.plisioCid,
        address,
        amount.toString(),
        'normal'
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feeData = response as any;
      const fee = parseFloat(feeData?.data?.fee || feeData?.fee || '0');

      return {
        fee,
        currency: this.plisioCid,
      };
    } catch (error) {
      console.error('Failed to estimate Plisio fee:', error);
      // Return a default fee estimate
      return {
        fee: 0.0001,
        currency: this.plisioCid,
      };
    }
  }

  /**
   * Check if Plisio is configured
   */
  isConfigured(): boolean {
    return !!process.env.PLISIO_SECRET_KEY;
  }

  /**
   * Extract transaction hash from Plisio tx_url
   * Example: https://blockchair.com/bitcoin/transaction/abc123 -> abc123
   */
  private extractTxHash(txUrl: string): string | undefined {
    try {
      const parts = txUrl.split('/');
      return parts[parts.length - 1];
    } catch {
      return undefined;
    }
  }
}

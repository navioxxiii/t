/**
 * Internal Payment Gateway Adapter
 *
 * Handles tokens that don't use an external payment gateway.
 * These use a shared/default address for deposits and require
 * manual reconciliation.
 */

import type {
  PaymentGateway,
  CreateDepositResult,
  WithdrawParams,
  WithdrawResult,
  FeeEstimate,
} from './types';

export class InternalAdapter implements PaymentGateway {
  readonly name = 'internal' as const;
  private defaultAddress: string | null;

  /**
   * Create an internal adapter
   *
   * @param defaultAddress Shared wallet address for deposits (optional)
   */
  constructor(defaultAddress?: string | null) {
    this.defaultAddress = defaultAddress || null;
  }

  /**
   * Return the shared default address
   * All users share the same deposit address
   */
  async createDepositAddress(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callbackUrl?: string
  ): Promise<CreateDepositResult> {
    if (!this.defaultAddress) {
      throw new Error(
        'Internal gateway requires a default_address in gateway_config'
      );
    }

    return {
      address: this.defaultAddress,
      isShared: true,
      isPermanent: true,
    };
  }

  /**
   * Withdrawals not supported for internal gateway
   * These require manual processing
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    // Internal gateway doesn't support automated withdrawals
    // These would need to be processed manually or through a different system
    console.warn(
      'Internal gateway withdrawal requested - requires manual processing:',
      {
        address: params.address,
        amount: params.amount,
        currency: params.currency,
      }
    );

    return {
      success: false,
      error:
        'Automated withdrawals not supported for internal gateway. Please process manually.',
    };
  }

  /**
   * No minimum for internal gateway (depends on network)
   */
  async getMinimumDeposit(): Promise<number> {
    return 0;
  }

  /**
   * No automated fee estimation for internal gateway
   */
  async estimateFee(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _amount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _address: string
  ): Promise<FeeEstimate> {
    return {
      fee: 0,
      currency: 'unknown',
    };
  }

  /**
   * Internal gateway is always "configured" (just uses default address)
   */
  isConfigured(): boolean {
    return this.defaultAddress !== null;
  }
}

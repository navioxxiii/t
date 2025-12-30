/**
 * Payment Gateway Interface
 *
 * Defines the common interface that all payment gateway adapters must implement.
 * This allows the application to work with multiple payment gateways
 * (Plisio, NOWPayments, internal) through a unified API.
 */

/**
 * Gateway types supported by the system
 */
export type GatewayType = 'plisio' | 'nowpayments' | 'internal';

/**
 * Gateway-specific configuration stored in token_deployments.gateway_config
 */
export interface GatewayConfig {
  // Plisio configuration
  cid?: string; // Plisio currency ID (e.g., 'BTC', 'USDT_TRX')

  // NOWPayments configuration
  currency?: string; // NOWPayments currency code (e.g., 'sol', 'xrp')

  // Internal gateway configuration
  default_address?: string; // Shared wallet address
}

/**
 * Result from creating a deposit address
 */
export interface CreateDepositResult {
  address: string;
  isShared: boolean;
  isPermanent: boolean;
  externalId?: string; // Payment ID from external gateway
  extraId?: string; // Memo/tag for XRP, XLM, etc.
}

/**
 * Parameters for withdrawal/payout
 */
export interface WithdrawParams {
  currency: string;
  address: string;
  amount: number;
  extraId?: string; // Memo/tag for currencies that require it
}

/**
 * Result from a withdrawal operation
 */
export interface WithdrawResult {
  success: boolean;
  transactionId?: string;
  transactionHash?: string;
  fee?: number;
  error?: string;
}

/**
 * Fee estimate for a withdrawal
 */
export interface FeeEstimate {
  fee: number;
  currency: string;
  feeInUsd?: number;
}

/**
 * Payment Gateway Interface
 *
 * All payment gateway adapters must implement this interface.
 */
export interface PaymentGateway {
  /**
   * Gateway name for identification
   */
  readonly name: GatewayType;

  /**
   * Create a deposit address for a user
   *
   * @param userId Internal user identifier
   * @param callbackUrl Optional webhook URL for payment notifications
   * @returns Deposit address information
   */
  createDepositAddress(
    userId: string,
    callbackUrl?: string
  ): Promise<CreateDepositResult>;

  /**
   * Execute a withdrawal/payout
   *
   * @param params Withdrawal parameters
   * @returns Withdrawal result
   */
  withdraw(params: WithdrawParams): Promise<WithdrawResult>;

  /**
   * Get minimum deposit amount
   *
   * @returns Minimum amount in the currency's native units
   */
  getMinimumDeposit(): Promise<number>;

  /**
   * Estimate withdrawal fee
   *
   * @param amount Amount to withdraw
   * @param address Destination address
   * @returns Fee estimate
   */
  estimateFee(amount: number, address: string): Promise<FeeEstimate>;

  /**
   * Check if the gateway is properly configured
   *
   * @returns true if gateway credentials are configured
   */
  isConfigured(): boolean;
}

/**
 * Token deployment with gateway information
 * Represents a row from the token_deployments table
 */
export interface TokenDeploymentWithGateway {
  id: number;
  symbol: string;
  display_name: string;
  decimals: number;
  gateway: GatewayType;
  gateway_config: GatewayConfig | null;
  base_token_id: number;
  network_id: number;
  is_active: boolean;
}

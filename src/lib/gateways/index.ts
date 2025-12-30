/**
 * Payment Gateway Abstraction Layer
 *
 * This module provides a unified interface for working with multiple
 * payment gateways (Plisio, NOWPayments, internal).
 *
 * Usage:
 * ```typescript
 * import { getGateway } from '@/lib/gateways';
 *
 * // Get gateway from token deployment
 * const gateway = getGateway(tokenDeployment);
 *
 * // Create deposit address
 * const { address } = await gateway.createDepositAddress(userId);
 *
 * // Withdraw
 * const result = await gateway.withdraw({
 *   currency: 'sol',
 *   address: destinationAddress,
 *   amount: 10,
 * });
 * ```
 */

// Types
export type {
  GatewayType,
  GatewayConfig,
  PaymentGateway,
  CreateDepositResult,
  WithdrawParams,
  WithdrawResult,
  FeeEstimate,
  TokenDeploymentWithGateway,
} from './types';

// Factory
export {
  getGateway,
  getGatewayByConfig,
  isValidGateway,
  getAutomatedDepositGateways,
  getAutomatedWithdrawalGateways,
  supportsAutomatedDeposits,
  supportsAutomatedWithdrawals,
} from './factory';

// Adapters (for direct use if needed)
export { PlisioAdapter } from './plisio-adapter';
export { NowPaymentsAdapter } from './nowpayments-adapter';
export { InternalAdapter } from './internal-adapter';

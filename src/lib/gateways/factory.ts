/**
 * Payment Gateway Factory
 *
 * Creates the appropriate payment gateway adapter based on
 * the token deployment's gateway configuration.
 */

import type {
  PaymentGateway,
  GatewayType,
  GatewayConfig,
  TokenDeploymentWithGateway,
} from './types';
import { PlisioAdapter } from './plisio-adapter';
import { NowPaymentsAdapter } from './nowpayments-adapter';
import { InternalAdapter } from './internal-adapter';

/**
 * Get a payment gateway instance for a token deployment
 *
 * @param deployment Token deployment with gateway configuration
 * @returns Payment gateway adapter instance
 * @throws Error if gateway type is unknown or configuration is invalid
 */
export function getGateway(deployment: TokenDeploymentWithGateway): PaymentGateway {
  return getGatewayByConfig(deployment.gateway, deployment.gateway_config);
}

/**
 * Get a payment gateway instance by gateway type and config
 *
 * @param gateway Gateway type ('plisio', 'nowpayments', 'internal')
 * @param config Gateway-specific configuration
 * @returns Payment gateway adapter instance
 */
export function getGatewayByConfig(
  gateway: GatewayType,
  config: GatewayConfig | null
): PaymentGateway {
  switch (gateway) {
    case 'plisio': {
      const cid = config?.cid;
      if (!cid) {
        throw new Error('Plisio gateway requires cid in gateway_config');
      }
      return new PlisioAdapter(cid);
    }

    case 'nowpayments': {
      const currency = config?.currency;
      if (!currency) {
        throw new Error('NOWPayments gateway requires currency in gateway_config');
      }
      return new NowPaymentsAdapter(currency);
    }

    case 'internal': {
      const defaultAddress = config?.default_address;
      return new InternalAdapter(defaultAddress);
    }

    default:
      throw new Error(`Unknown gateway type: ${gateway}`);
  }
}

/**
 * Check if a gateway type is valid
 */
export function isValidGateway(gateway: string): gateway is GatewayType {
  return ['plisio', 'nowpayments', 'internal'].includes(gateway);
}

/**
 * Get list of gateways that support automated deposits
 */
export function getAutomatedDepositGateways(): GatewayType[] {
  return ['plisio', 'nowpayments'];
}

/**
 * Get list of gateways that support automated withdrawals
 */
export function getAutomatedWithdrawalGateways(): GatewayType[] {
  return ['plisio', 'nowpayments'];
}

/**
 * Check if a gateway supports automated deposits
 */
export function supportsAutomatedDeposits(gateway: GatewayType): boolean {
  return getAutomatedDepositGateways().includes(gateway);
}

/**
 * Check if a gateway supports automated withdrawals
 */
export function supportsAutomatedWithdrawals(gateway: GatewayType): boolean {
  return getAutomatedWithdrawalGateways().includes(gateway);
}

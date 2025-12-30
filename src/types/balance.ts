/**
 * TypeScript interfaces for unified balance system
 *
 * This file defines the type structure for the new centralized balance system
 * where users have one unified balance per base token (e.g., single USDT balance)
 * with multiple deposit addresses across different networks.
 */

// Base token (concept - USDT, BTC, ETH)
export interface BaseToken {
  id: number;
  code: string;
  symbol: string;
  name: string;
  token_type: string;
  is_stablecoin: boolean;
  decimals: number;
  icon: string;
  logo_url: string;
}

// Network (blockchain)
export interface Network {
  id: number;
  code: string;
  name: string;
  display_name: string;
  network_type: string;
  withdrawal_fee: number;
  withdrawal_fee_percent: number;
  min_withdrawal: number;
  max_withdrawal: number | null;
  withdrawal_enabled: boolean;
  deposit_enabled: boolean;
  logo_url: string;
  explorer_url: string;
}

// Gateway types
export type GatewayType = 'plisio' | 'nowpayments' | 'internal';

// Gateway-specific configuration
export interface GatewayConfig {
  cid?: string;           // Plisio currency ID
  currency?: string;      // NOWPayments currency code
  default_address?: string; // Internal gateway address
}

// Token deployment on specific network
export interface TokenDeployment {
  id: number;
  symbol: string;
  display_name: string;
  token_standard: string;
  contract_address: string | null;
  decimals: number;
  gateway?: GatewayType;
  gateway_config?: GatewayConfig | null;
}

// Deposit address for specific deployment
export interface DepositAddress {
  id: string;
  address: string;
  extra_id: string | null; // Destination tag/memo for XRP, XLM, etc.
  is_shared: boolean;
  is_permanent: boolean;
  created_at: string;
  deployment: TokenDeployment;
  network: Network;
}

// User balance (NEW structure)
export interface UserBalance {
  token: BaseToken;
  balance: string;
  locked_balance: string;
  available_balance: string;
  updated_at: string;
  deposit_addresses: DepositAddress[];
}

// API response
export interface BalancesResponse {
  balances: UserBalance[];
  count: number;
  total_networks: number;
}

// Token preference
export interface TokenPreference {
  id: number;
  user_id: string;
  base_token_id: number;
  is_visible: boolean;
  base_tokens: {
    id: number;
    code: string;
    symbol: string;
    name: string;
    logo_url: string;
  };
}

// Helper type for network selection
export interface NetworkOption {
  network: Network;
  deployment: TokenDeployment;
  address: string;
}

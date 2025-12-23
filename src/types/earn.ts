/**
 * Earn Feature Type Definitions
 * Shared types for vaults, positions, and API responses
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export type VaultStatus = 'active' | 'sold_out' | 'ended';
export type PositionStatus = 'active' | 'matured' | 'withdrawn';
export type RiskLevel = 'low' | 'medium' | 'high';
export type DurationMonths = 1 | 3 | 6 | 12;

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE MODELS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Investment Vault Product
 */
export interface EarnVault {
  id: string;
  title: string;
  subtitle: string | null;
  apy_percent: number;
  duration_months: DurationMonths;
  min_amount: number;
  max_amount: number | null;
  total_capacity: number | null;
  current_filled: number;
  status: VaultStatus;
  risk_level: RiskLevel;
  starts_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * User's Investment Position
 */
export interface UserEarnPosition {
  id: string;
  user_id: string;
  vault_id: string;
  amount_usdt: number;
  daily_profit_rate: number;
  total_profit_usdt: number;
  status: PositionStatus;
  invested_at: string;
  matures_at: string;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vault availability calculation
 */
export interface VaultAvailability {
  isFull: boolean;
  fillPercentage: number;
  remainingCapacity: number | null;
}

/**
 * Vault with availability info (API response)
 */
export interface VaultWithAvailability extends EarnVault {
  availability: VaultAvailability;
}

/**
 * Position profit calculations (API response)
 */
export interface PositionCalculations {
  current_profit: number;
  days_elapsed: number;
  days_remaining: number;
  hours_remaining: number;
  progress_percentage: number;
  is_matured: boolean;
}

/**
 * Position with vault and calculations (API response)
 */
export interface PositionWithDetails extends UserEarnPosition {
  vault: EarnVault;
  calculated: PositionCalculations;
}

/**
 * Portfolio summary statistics
 */
export interface PortfolioSummary {
  total_active_positions: number;
  total_invested: number;
  total_current_profit: number;
  total_matured_positions: number;
  total_lifetime_earnings: number;
}

/**
 * Positions grouped by status
 */
export interface GroupedPositions {
  active: PositionWithDetails[];
  matured: PositionWithDetails[];
  withdrawn: PositionWithDetails[];
}

// ═══════════════════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/earn/vaults response
 */
export interface VaultsResponse {
  vaults: VaultWithAvailability[];
  count: number;
}

/**
 * POST /api/earn/invest request
 */
export interface InvestRequest {
  vaultId: string;
  amount: number;
}

/**
 * POST /api/earn/invest response
 */
export interface InvestResponse {
  success: boolean;
  position: PositionWithDetails;
  message: string;
}

/**
 * GET /api/earn/positions response
 */
export interface PositionsResponse {
  positions: PositionWithDetails[];
  grouped: GroupedPositions;
  summary: PortfolioSummary;
}

/**
 * POST /api/earn/claim request
 */
export interface ClaimRequest {
  positionId: string;
}

/**
 * Claim payout breakdown
 */
export interface ClaimPayout {
  principal: number;
  profit: number;
  total: number;
}

/**
 * POST /api/earn/claim response
 */
export interface ClaimResponse {
  success: boolean;
  payout: ClaimPayout;
  new_balance: number;
  message: string;
}

/**
 * GET/POST /api/earn/mature-cron response
 */
export interface MaturedPosition {
  id: string;
  amount: number;
  profit: number;
  matured_at: string;
}

export interface MatureCronResponse {
  success: boolean;
  message: string;
  matured_count: number;
  matured_positions?: MaturedPosition[];
  timestamp?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EarnError {
  error: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Profit calculation parameters
 */
export interface ProfitCalculation {
  principal: number;
  apy: number;
  durationMonths: number;
  daysElapsed?: number;
}

/**
 * Investment validation result
 */
export interface InvestmentValidation {
  valid: boolean;
  error?: string;
  details?: {
    amount: number;
    vault: EarnVault;
    userBalance: number;
  };
}

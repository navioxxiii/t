/**
 * P&L Simulator for Copy Trading
 * Uses Geometric Brownian Motion with Mean Reversion
 *
 * This module creates realistic portfolio value fluctuations that:
 * - Go UP AND DOWN (not just up)
 * - Trend toward target ROI over time
 * - Scale volatility by risk level
 * - Respect max drawdown limits
 * - Provide trader-level correlation (all users copying same trader see same performance)
 */

export interface SimulationParams {
  target_monthly_roi: number;
  daily_drift: number;
  daily_volatility: number;
  max_drawdown_usdt: number;
  min_pnl_usdt: number;
  momentum: number;
}

export interface Trader {
  historical_roi_min: number;
  historical_roi_max: number;
  risk_level: 'low' | 'medium' | 'high';
  max_drawdown: number;
}

// Volatility levels by risk category (daily standard deviation)
const VOLATILITY_MAP = {
  low: 0.008,      // 0.8% daily volatility
  medium: 0.015,   // 1.5% daily volatility
  high: 0.025      // 2.5% daily volatility
};

/**
 * Initialize simulation parameters for a new copy trading position
 *
 * @param trader - Trader object with ROI range, risk level, and max drawdown
 * @param allocation - Initial investment amount in USDT
 * @returns SimulationParams object for use in P&L updates
 */
export function initializeSimulationParams(
  trader: Trader,
  allocation: number
): SimulationParams {
  // Calculate target monthly ROI (average of historical range)
  const monthlyRoiTarget =
    (trader.historical_roi_min + trader.historical_roi_max) / 2;

  // Convert to daily drift using compound growth formula
  // (1 + monthly_roi)^(1/30) - 1
  const dailyDrift = Math.pow(1 + (monthlyRoiTarget / 100), 1 / 30) - 1;

  // Get volatility for risk level
  const dailyVolatility = VOLATILITY_MAP[trader.risk_level] || 0.015;

  // Calculate max drawdown limit (as negative USDT value)
  const maxDrawdown = trader.max_drawdown || 0.20;
  const maxDrawdownUsdt = -(allocation * maxDrawdown);

  return {
    target_monthly_roi: monthlyRoiTarget,
    daily_drift: dailyDrift,
    daily_volatility: dailyVolatility,
    max_drawdown_usdt: maxDrawdownUsdt,
    min_pnl_usdt: maxDrawdownUsdt,
    momentum: 0
  };
}

/**
 * Seeded random number generator for deterministic trader shocks
 * Ensures all positions copying the same trader get identical random numbers
 *
 * @param seed - Unique string seed (traderId + timestamp)
 * @returns Pseudo-random number between 0 and 1
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate trader-specific shock for current 5-minute period
 * Uses Box-Muller transform to create normally-distributed random numbers
 *
 * All positions copying the same trader in the same 5-min period get the same shock,
 * ensuring correlated performance across users.
 *
 * @param traderId - Unique trader identifier
 * @param timestamp - Current timestamp
 * @returns Normal random number (mean=0, std=1)
 */
export function getTraderShock(traderId: string, timestamp: Date): number {
  // Round to 5-minute intervals (288 periods per day)
  const minutes = timestamp.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  const periodStart = new Date(timestamp);
  periodStart.setMinutes(roundedMinutes, 0, 0);

  // Create unique seed for this trader + period
  const seed = `${traderId}_${periodStart.toISOString()}`;

  // Generate two uniform randoms for Box-Muller transform
  const u1 = seededRandom(seed + '_1');
  const u2 = seededRandom(seed + '_2');

  // Box-Muller transform: converts uniform -> normal distribution
  const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return normalRandom;
}

/**
 * Calculate P&L update using Geometric Brownian Motion with Mean Reversion
 *
 * Components:
 * 1. Drift - Upward bias toward target ROI
 * 2. Volatility - Random walk scaled by risk level
 * 3. Mean Reversion - Pulls back toward expected trajectory
 * 4. Momentum - Short-term autocorrelation for realistic trends
 * 5. Max Drawdown Protection - Hard floor at trader's max loss
 *
 * @param allocation - Initial investment amount
 * @param currentPnl - Current P&L value
 * @param params - Simulation parameters from initializeSimulationParams
 * @param startedAt - Position start date
 * @param traderId - Trader ID for correlation
 * @returns New P&L value and momentum
 */
export function calculatePnLUpdate(
  allocation: number,
  currentPnl: number,
  params: SimulationParams,
  startedAt: Date,
  traderId: string
): { newPnl: number; newMomentum: number } {
  const currentValue = allocation + currentPnl;
  const dtFactor = 1 / 288; // 5-min interval factor (288 periods per day)

  // 1. MEAN REVERSION - pull toward expected trajectory
  const daysElapsed = (Date.now() - startedAt.getTime()) / (86400000);
  const expectedPnl = allocation *
    (Math.pow(1 + (params.target_monthly_roi / 100), daysElapsed / 30) - 1);
  const deviation = currentPnl - expectedPnl;
  const meanReversionForce = -deviation * 0.1 * dtFactor;

  // 2. DRIFT - upward bias toward target
  const driftComponent = params.daily_drift * currentValue * dtFactor;

  // 3. VOLATILITY - trader-level random shock (correlated across positions)
  const normalRandom = getTraderShock(traderId, new Date());
  const volatilityComponent =
    params.daily_volatility * currentValue * Math.sqrt(dtFactor) * normalRandom;

  // 4. MOMENTUM - short-term autocorrelation
  const momentumDecay = 0.95;
  const newMomentumRaw = (params.momentum * momentumDecay) + (0.3 * normalRandom);
  const newMomentum = Math.max(-1, Math.min(1, newMomentumRaw)); // Clamp to [-1, 1]
  const momentumComponent =
    newMomentum * params.daily_volatility * currentValue * dtFactor * 0.5;

  // 5. COMBINE ALL COMPONENTS
  const pnlChange =
    driftComponent + volatilityComponent + meanReversionForce + momentumComponent;
  let newPnl = currentPnl + pnlChange;

  // 6. ENFORCE MAX DRAWDOWN with bounce
  if (newPnl < params.min_pnl_usdt) {
    // Hit the floor - add small random bounce
    newPnl = params.min_pnl_usdt + (Math.random() * allocation * 0.01);
  }

  // 7. CAP SINGLE-PERIOD JUMPS (prevent unrealistic spikes)
  const maxSingleChange = allocation * 0.05; // 5% max change per period
  const actualChange = newPnl - currentPnl;
  if (Math.abs(actualChange) > maxSingleChange) {
    newPnl = currentPnl + (Math.sign(actualChange) * maxSingleChange);
  }

  return { newPnl, newMomentum };
}

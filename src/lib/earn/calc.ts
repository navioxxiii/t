/**
 * Earn calculation helpers
 * Single source of truth for maturity dates, profit and accrual - shared by API routes and UI
 */

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/** Add calendar months, clamping to the last day of the target month (Jan 31 + 1 → Feb 28/29) */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfMonth));
  return result;
}

/** Round a USDT amount to cents */
export function roundUsd(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Total profit at maturity: principal × APY × (months / 12), rounded to cents */
export function calcTotalProfit(principal: number, apyPercent: number, durationMonths: number): number {
  return roundUsd(principal * (apyPercent / 100) * (durationMonths / 12));
}

/** Profit per day over the actual lock period */
export function calcDailyRate(totalProfit: number, investedAt: Date, maturesAt: Date): number {
  const days = (maturesAt.getTime() - investedAt.getTime()) / MS_PER_DAY;
  return days > 0 ? totalProfit / days : totalProfit;
}

interface AccrualInput {
  invested_at: string;
  matures_at: string;
  total_profit_usdt: number;
}

/** Fraction of the lock period elapsed, clamped to [0, 1] */
function elapsedFraction(position: Pick<AccrualInput, 'invested_at' | 'matures_at'>, now: number): number {
  const start = new Date(position.invested_at).getTime();
  const end = new Date(position.matures_at).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** Profit accrued so far, linear over the lock period and capped at the total */
export function calcAccruedProfit(position: AccrualInput, now: number = Date.now()): number {
  return Number(position.total_profit_usdt) * elapsedFraction(position, now);
}

export interface PositionProgress {
  days_elapsed: number;
  days_remaining: number;
  hours_remaining: number;
  progress_percentage: number;
  is_matured: boolean;
}

export function getPositionProgress(
  position: Pick<AccrualInput, 'invested_at' | 'matures_at'>,
  now: number = Date.now()
): PositionProgress {
  const start = new Date(position.invested_at).getTime();
  const end = new Date(position.matures_at).getTime();
  const msRemaining = Math.max(0, end - now);

  return {
    days_elapsed: Math.max(0, Math.floor((now - start) / MS_PER_DAY)),
    days_remaining: Math.floor(msRemaining / MS_PER_DAY),
    hours_remaining: Math.floor((msRemaining % MS_PER_DAY) / MS_PER_HOUR),
    progress_percentage: elapsedFraction(position, now) * 100,
    is_matured: now >= end,
  };
}

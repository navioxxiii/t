-- ════════════════════════════════════════════════════════════════════════════
-- Demo copy-trading: realistic "leaderboard-style" trader figures
--
-- Run in the Supabase SQL editor. Updates the 5 demo traders by name and
-- re-targets the simulation params of their ACTIVE positions so open demo
-- positions drift toward the new figures (see src/lib/copy-trade/pnl-simulator.ts).
--
-- Conventions (match existing data):
--   historical_roi_* / monthly_roi  → percent   (15 = 15%)
--   max_drawdown / win_rate         → fraction  (0.50 = 50%)
--   monthly_roi = midpoint of range → the simulator's target_monthly_roi
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

WITH figures (name, roi_min, roi_max, max_dd, fee, win_rate, hold_hours) AS (
  VALUES
    ('AltcoinHunter',  10.0, 20.0, 0.50, 20, 0.38, 336),
    ('DeFiWhale',       8.0, 16.0, 0.45, 20, 0.54,   6),
    ('MomentumMaster',  5.0, 10.0, 0.30, 15, 0.41,  60),
    ('CryptoSage',      2.0,  5.0, 0.20, 12, 0.58, 500),
    ('StableSam',       1.5,  3.5, 0.20, 10, 0.62, 720)
)
UPDATE traders t
SET
  historical_roi_min      = f.roi_min,
  historical_roi_max      = f.roi_max,
  max_drawdown            = f.max_dd,
  performance_fee_percent = f.fee,
  stats = COALESCE(t.stats, '{}'::jsonb) || jsonb_build_object(
    'monthly_roi',         (f.roi_min + f.roi_max) / 2,
    'win_rate',            f.win_rate,
    'avg_hold_time_hours', f.hold_hours
  ),
  updated_at = NOW()
FROM figures f
WHERE t.name = f.name;

-- Re-target active positions (same formulas as initializeSimulationParams)
UPDATE user_copy_positions p
SET simulation_params = COALESCE(p.simulation_params, '{}'::jsonb) || jsonb_build_object(
  'target_monthly_roi', (t.historical_roi_min + t.historical_roi_max) / 2,
  'daily_drift',        POWER(1 + ((t.historical_roi_min + t.historical_roi_max) / 2) / 100.0, 1.0 / 30) - 1,
  'max_drawdown_usdt',  -(p.allocation_usdt * t.max_drawdown),
  'min_pnl_usdt',       -(p.allocation_usdt * t.max_drawdown)
)
FROM traders t
WHERE p.trader_id = t.id
  AND p.status = 'active'
  AND t.name IN ('AltcoinHunter', 'DeFiWhale', 'MomentumMaster', 'CryptoSage', 'StableSam');

-- Check the result (expect 5 rows)
SELECT
  name,
  risk_level,
  historical_roi_min,
  historical_roi_max,
  stats->>'monthly_roi'         AS monthly_roi,
  max_drawdown,
  performance_fee_percent,
  stats->>'win_rate'            AS win_rate,
  stats->>'avg_hold_time_hours' AS hold_hours
FROM traders
ORDER BY (stats->>'monthly_roi')::numeric DESC;

COMMIT;

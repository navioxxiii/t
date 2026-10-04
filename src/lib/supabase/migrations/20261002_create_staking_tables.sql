-- Staking (pooled, custodial)
--
-- Users stake proof-of-stake coins they hold. The ops team stakes the pooled coins,
-- admins record the rewards actually received per coin per day, and a daily job
-- distributes them pro-rata (minus commission) and releases finished unbonding.
--
-- All writes happen through API routes using the service role; users can only read
-- their own positions and rewards.
--
-- Created: 2026-10-02

-- ─── Stakeable coins and their terms ───
CREATE TABLE IF NOT EXISTS staking_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_token_id BIGINT NOT NULL UNIQUE REFERENCES base_tokens(id),
  enabled BOOLEAN NOT NULL DEFAULT false,
  min_stake NUMERIC(36, 18) NOT NULL DEFAULT 0 CHECK (min_stake >= 0),
  unbonding_days INTEGER NOT NULL DEFAULT 0 CHECK (unbonding_days >= 0),
  commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent < 100),
  -- Shown (labelled as an estimate) until there is realized reward history
  estimated_apy NUMERIC(6, 2) CHECK (estimated_apy IS NULL OR estimated_apy >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User stakes (one row per stake) ───
CREATE TABLE IF NOT EXISTS user_staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_token_id BIGINT NOT NULL REFERENCES base_tokens(id),
  amount NUMERIC(36, 18) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unbonding', 'withdrawn')),
  rewards_total NUMERIC(36, 18) NOT NULL DEFAULT 0,
  staked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unstake_requested_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_positions_user ON user_staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_token_status ON user_staking_positions(base_token_id, status);
CREATE INDEX IF NOT EXISTS idx_staking_positions_unbonding ON user_staking_positions(available_at) WHERE status = 'unbonding';

-- ─── Rewards the platform actually received, recorded by admins ───
CREATE TABLE IF NOT EXISTS staking_reward_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_token_id BIGINT NOT NULL REFERENCES base_tokens(id),
  reward_date DATE NOT NULL,
  gross_amount NUMERIC(36, 18) NOT NULL CHECK (gross_amount > 0),
  commission_percent NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(36, 18) NOT NULL DEFAULT 0,
  distributed_amount NUMERIC(36, 18) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'distributing', 'distributed')),
  recipients INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  distributed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One batch per coin per day, so a day's rewards can't be entered twice
  UNIQUE (base_token_id, reward_date)
);

-- ─── Each user's share of a batch (unique per batch + position: reruns never pay twice) ───
CREATE TABLE IF NOT EXISTS staking_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES staking_reward_batches(id),
  position_id UUID NOT NULL REFERENCES user_staking_positions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_token_id BIGINT NOT NULL REFERENCES base_tokens(id),
  amount NUMERIC(36, 18) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_staking_rewards_user ON staking_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_token_created ON staking_rewards(base_token_id, created_at);

-- ─── Row Level Security ───
ALTER TABLE staking_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_reward_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can view staking assets" ON staking_assets;
CREATE POLICY "Signed-in users can view staking assets"
  ON staking_assets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view their own staking positions" ON user_staking_positions;
CREATE POLICY "Users can view their own staking positions"
  ON user_staking_positions FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own staking rewards" ON staking_rewards;
CREATE POLICY "Users can view their own staking rewards"
  ON staking_rewards FOR SELECT TO authenticated USING (user_id = auth.uid());

-- staking_reward_batches: no user policies (service role / admin routes only)

-- ─── Transactions ───
-- transactions.type is restricted by a CHECK constraint. Replace it with the same list
-- plus the four staking types. Done by lookup so it works whatever the constraint is named.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'transactions'
      AND c.contype = 'c'
      -- Only the constraint listing transaction types (it names 'earn_invest'), never other checks
      AND pg_get_constraintdef(c.oid) ILIKE '%type%'
      AND pg_get_constraintdef(c.oid) ILIKE '%earn_invest%'
  LOOP
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN (
    'deposit', 'withdrawal', 'swap',
    'earn_invest', 'earn_claim',
    'copy_trade_start', 'copy_trade_stop',
    'staking_stake', 'staking_unstake', 'staking_reward', 'staking_release'
  )
);

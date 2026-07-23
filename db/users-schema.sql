-- Cloud accounts + Portfolio / Wardrobe sync (PostgreSQL / Neon)
-- Apply with:  psql "$DATABASE_URL" -f db/users-schema.sql
-- Or:         node scripts/migrate-users.mjs

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS app_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  username        citext NOT NULL UNIQUE,
  password_salt   text NOT NULL,
  password_hash   text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Full client vault as JSONB (holdings + closet + fits). Soft-launch sync
-- keeps one document per user so Portfolio and Wardrobe stay in lockstep.
CREATE TABLE IF NOT EXISTS user_vaults (
  user_id         uuid PRIMARY KEY REFERENCES app_users (id) ON DELETE CASCADE,
  holdings        jsonb NOT NULL DEFAULT '[]'::jsonb,
  closet          jsonb NOT NULL DEFAULT '[]'::jsonb,
  fits            jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_vaults_holdings_is_array CHECK (jsonb_typeof(holdings) = 'array'),
  CONSTRAINT user_vaults_closet_is_array CHECK (jsonb_typeof(closet) = 'array'),
  CONSTRAINT user_vaults_fits_is_array CHECK (jsonb_typeof(fits) = 'array')
);

-- Legacy normalized holdings table (optional; vault JSONB is the live path).
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  sneaker_slug    text NOT NULL,
  size_label      text NOT NULL DEFAULT '—',
  quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity < 1000),
  cost_basis_usd  numeric(12, 2),
  acquired_at     date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_holdings_user_idx
  ON portfolio_holdings (user_id, created_at DESC);

COMMIT;

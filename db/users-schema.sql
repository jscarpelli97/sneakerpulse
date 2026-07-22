-- Future cloud accounts + portfolio (PostgreSQL)
-- Apply when DATABASE_URL is configured. Until then, Portfolio uses a
-- device-local vault in the browser (see src/lib/portfolio/vault.ts).

BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  username        citext NOT NULL UNIQUE,
  password_hash   text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

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

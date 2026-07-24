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

-- Monthly KicksDB request counter (free tier ≈ 1k / month).
CREATE TABLE IF NOT EXISTS kicks_quota (
  month_key   char(7) PRIMARY KEY,
  used        integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Pairs looked up via search / market pages — reused site-wide without
-- re-hitting KicksDB for the same slug.
CREATE TABLE IF NOT EXISTS discovered_products (
  slug            text PRIMARY KEY,
  ticker          text NOT NULL DEFAULT '—',
  style_code      text NOT NULL DEFAULT '—',
  name            text NOT NULL,
  brand           text NOT NULL DEFAULT 'Unknown',
  year            integer,
  release_date    text,
  colorway        text,
  retail          numeric(12, 2) NOT NULL DEFAULT 0,
  stockx_url      text NOT NULL DEFAULT '',
  fallback_image  text NOT NULL DEFAULT '',
  featured        boolean NOT NULL DEFAULT false,
  rank            integer,
  price           numeric(12, 2),
  weekly_orders   integer,
  source          text NOT NULL DEFAULT 'search',
  captured_at     timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discovered_products_updated_idx
  ON discovered_products (updated_at DESC);

CREATE INDEX IF NOT EXISTS discovered_products_brand_idx
  ON discovered_products (brand);

-- Plus purchases (Stripe / OpenNode / mock) — founding cohort + membership audit.
CREATE TABLE IF NOT EXISTS plus_purchases (
  id            text PRIMARY KEY,
  email         citext NOT NULL,
  provider      text NOT NULL,
  plan          text NOT NULL DEFAULT 'plus',
  amount_usd    numeric(12, 2) NOT NULL,
  term_days     integer NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  paid_at       timestamptz
);

CREATE INDEX IF NOT EXISTS plus_purchases_email_idx
  ON plus_purchases (email);

CREATE INDEX IF NOT EXISTS plus_purchases_founding_paid_idx
  ON plus_purchases (plan, status)
  WHERE plan = 'founding' AND status = 'paid';

COMMIT;

-- SneakerPulse price-history schema (PostgreSQL 15+)
-- Optional: enable TimescaleDB for hypertables (see comments at bottom).
--
-- Design goals:
-- 1) Normalize sneakers + marketplaces (write once, join for display)
-- 2) Append-only price_snapshots as the time-series fact table
-- 3) Index for “latest N points for one sneaker” and catalog-wide rollups
-- 4) Partition / hypertable-ready for multi-year growth

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Dimension: marketplaces (StockX, GOAT, …)
-- ---------------------------------------------------------------------------
CREATE TABLE marketplaces (
  id              smallserial PRIMARY KEY,
  code            text NOT NULL UNIQUE,          -- e.g. 'stockx', 'goat'
  display_name    text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO marketplaces (code, display_name) VALUES
  ('stockx', 'StockX'),
  ('goat', 'GOAT')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Dimension: sneakers
-- ---------------------------------------------------------------------------
CREATE TABLE sneakers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,          -- StockX / catalog slug
  style_code      text,                          -- SKU / style code
  ticker          text,
  name            text NOT NULL,
  brand           text,
  colorway        text,
  retail_price    numeric(12, 2),
  release_date    date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sneakers_style_code_idx ON sneakers (style_code);
CREATE INDEX sneakers_brand_idx ON sneakers (brand);

-- ---------------------------------------------------------------------------
-- Fact: price snapshots (append-only market history)
-- Each row is one observation for one sneaker on one marketplace.
-- ---------------------------------------------------------------------------
CREATE TABLE price_snapshots (
  id              bigserial,

  -- Required snapshot fields
  sneaker_id      uuid NOT NULL REFERENCES sneakers (id) ON DELETE CASCADE,
  marketplace_id  smallint NOT NULL REFERENCES marketplaces (id),
  captured_at     timestamptz NOT NULL,           -- snapshot timestamp (UTC)

  lowest_ask      numeric(12, 2),                 -- nullable when no asks
  highest_bid     numeric(12, 2),                 -- nullable when feed omits bids
  last_sale       numeric(12, 2),                 -- nullable when unknown
  average_sale    numeric(12, 2),                 -- windowed avg (document window in notes)

  -- Optional operational metadata (does not change the core contract)
  currency        char(3) NOT NULL DEFAULT 'USD',
  avg_sale_window text,                           -- e.g. '30d', '90d', '1d'
  source          text NOT NULL DEFAULT 'kicksdb', -- collector identity
  notes           text,

  PRIMARY KEY (id),

  -- One observation per sneaker × marketplace × instant
  CONSTRAINT price_snapshots_unique_observation
    UNIQUE (sneaker_id, marketplace_id, captured_at),

  CONSTRAINT price_snapshots_nonneg_check CHECK (
    (lowest_ask IS NULL OR lowest_ask >= 0)
    AND (highest_bid IS NULL OR highest_bid >= 0)
    AND (last_sale IS NULL OR last_sale >= 0)
    AND (average_sale IS NULL OR average_sale >= 0)
  )
);

-- Hot path: chart / history for one sneaker on one marketplace
CREATE INDEX price_snapshots_sneaker_time_idx
  ON price_snapshots (sneaker_id, marketplace_id, captured_at DESC);

-- Catalog rollups / “what changed since T”
CREATE INDEX price_snapshots_time_idx
  ON price_snapshots (captured_at DESC);

-- Marketplace-scoped scans (e.g. StockX-only nightly jobs)
CREATE INDEX price_snapshots_marketplace_time_idx
  ON price_snapshots (marketplace_id, captured_at DESC);

-- ---------------------------------------------------------------------------
-- Convenience view: latest snapshot per sneaker × marketplace
-- ---------------------------------------------------------------------------
CREATE VIEW price_snapshots_latest AS
SELECT DISTINCT ON (sneaker_id, marketplace_id)
  sneaker_id,
  marketplace_id,
  captured_at,
  lowest_ask,
  highest_bid,
  last_sale,
  average_sale,
  currency,
  source
FROM price_snapshots
ORDER BY sneaker_id, marketplace_id, captured_at DESC;

COMMIT;

-- ---------------------------------------------------------------------------
-- Scaling upgrade path (run when row counts grow)
-- ---------------------------------------------------------------------------
-- 1) Range-partition price_snapshots by captured_at (monthly), e.g.:
--    CREATE TABLE price_snapshots (...) PARTITION BY RANGE (captured_at);
--
-- 2) Or convert to a TimescaleDB hypertable:
--    CREATE EXTENSION IF NOT EXISTS timescaledb;
--    SELECT create_hypertable('price_snapshots', 'captured_at',
--      chunk_time_interval => INTERVAL '1 month',
--      migrate_data => true);
--    ALTER TABLE price_snapshots SET (
--      timescaledb.compress,
--      timescaledb.compress_segmentby = 'sneaker_id,marketplace_id'
--    );
--    SELECT add_compression_policy('price_snapshots', INTERVAL '30 days');
--    SELECT add_retention_policy('price_snapshots', INTERVAL '3 years');
--
-- 3) Keep writing through COPY / multi-row INSERT from the snapshot worker.
--    Prefer upserts:
--      INSERT ... ON CONFLICT (sneaker_id, marketplace_id, captured_at)
--      DO UPDATE SET lowest_ask = EXCLUDED.lowest_ask, ...

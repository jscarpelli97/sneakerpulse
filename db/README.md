# Price history database schema

PostgreSQL schema for collecting historical sneaker market snapshots.
Apply with:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

This is a **design + migration artifact**. The live app still uses JSON snapshots
in `src/data/` until a database is wired in. Portfolio / Wardrobe accounts use
**cloud sync** when `DATABASE_URL` is set (`db/users-schema.sql` +
`scripts/migrate-users.mjs`); otherwise they fall back to a device-local vault
(`src/lib/portfolio/localVault.ts`).

## Tables

### `marketplaces`
Lookup for venues (`stockx`, `goat`, …). Snapshots reference `marketplace_id`
instead of storing the marketplace string on every row.

### `sneakers`
Canonical sneaker identity (`id`, `slug`, style code, retail, etc.).
Catalog metadata lives here once; history rows only store `sneaker_id`.

### `price_snapshots` (fact / time series)
One row per observation:

| Column | Meaning |
| --- | --- |
| `captured_at` | Snapshot timestamp (UTC) |
| `lowest_ask` | Lowest ask at capture |
| `highest_bid` | Highest bid at capture (nullable if feed lacks bids) |
| `last_sale` | Most recent sale price known at capture |
| `average_sale` | Average sale for the documented window |
| `marketplace_id` | FK → `marketplaces` |
| `sneaker_id` | FK → `sneakers` |

Unique key: `(sneaker_id, marketplace_id, captured_at)` so re-runs are idempotent.

### `price_snapshots_latest`
View returning the newest row per sneaker × marketplace for quote boards.

## How this scales to thousands of sneakers

### Row volume (order-of-magnitude)

| Tracked sneakers | Cadence | Marketplaces | Rows / year |
| --- | --- | --- | --- |
| 1,000 | daily | 1 | ~0.37M |
| 5,000 | daily | 2 | ~3.7M |
| 10,000 | hourly | 2 | ~175M |

PostgreSQL handles the daily cases with B-tree indexes alone. Hourly × multi-marketplace
is when you enable **monthly partitions** or **TimescaleDB hypertables** (see comments
in `schema.sql`).

### Write path
- Snapshot worker batches inserts (`COPY` or multi-row `INSERT … ON CONFLICT`).
- Do **not** update historical rows except for idempotent upserts of the same timestamp.
- Shard work by sneaker id ranges or marketplace so collectors parallelize safely.

### Read path
- Charts: `WHERE sneaker_id = $1 AND marketplace_id = $2 AND captured_at >= $3 ORDER BY captured_at`.
  Covered by `price_snapshots_sneaker_time_idx`.
- Latest quotes: use `price_snapshots_latest` or a small Redis/materialized cache refreshed after each job.
- Avoid `SELECT *` over the full fact table for homepage boards.

### Storage & retention
- Keep money as `numeric(12,2)` (exact cents, not float).
- Compress old chunks (Timescale) after ~30 days; retain raw ticks 1–3 years, then downsample to daily OHLC if needed.
- Nullable `highest_bid` / sale fields are intentional — missing upstream data must not block ask capture.

### Separation of concerns
- JSON files in `src/data/` remain the free-tier bootstrap path.
- Database becomes the system of record once `DATABASE_URL` is configured and the
  snapshot job writes here instead of (or in addition to) JSON append.

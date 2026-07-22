# SneakerPulse

Next.js market app tracking StockX’s **current top 100 selling sneakers** (by sales rank) with live ask, volume, and market pages.

## Design standard

The **markets terminal** look from the homepage is the site-wide visual standard until explicitly changed:

- Dark surfaces (`dash-bg` / `dash-panel`), Syne + Instrument + Plex Mono
- Gold accent CTAs, teal/red for up/down
- `dash-card` panels, sticky terminal chrome, `max-w-[1400px]` shells
- Tokens and surfaces live in `src/app/globals.css` (`--dash-*`, `.dash-card`)
- Root layout applies the `dashboard` class by default; `SiteHeader` / `SiteFooter` default to `variant="dashboard"`

Do not reintroduce the old light ink/paper theme unless asked.

## SneakerPulse Index (SPI)

Homepage market pulse inspired by Chrono24’s ChronoPulse — **whole StockX market**, not a single brand:

- **Long history (ALL / 1Y):** chained Laspeyres on rotating top-200 colorways
  - **Apr 2012 → Jul 2020:** embSneakers whole-catalog StockX transactions (~13M trades / ~12k products), monthly LOCF daily — `stockx-whole-market-2012-2020.json`
  - **Aug → early Nov 2020:** level held (no public daily feed)
  - **Nov 2020 → Dec 2021:** Flurin17 daily StockX snapshots (~4k products, lowest ask) — merged into `stockx-whole-market-2012-2021.json`
- **Daily extension (from first `npm run snapshot` onward):** live top-100 Laspeyres appended to `spi-daily-extension.json` (anchored to the Dec 2021 level so the long series can resume)
- **Live window (3M / shorter):** rotating basket of the current top StockX sellers by sales rank (bootstrap from StockX stats when needed)
- **Gap:** no free public whole-market daily feed for **Jan 2022 → day before extension starts**. Charts draw the pre-gap and extension segments separately (no invented line across missing years).

Rebuild / extend:

```bash
# embSneakers Dropbox dump (bit.ly/3DvnC6p) → 2012–2020 segment
node scripts/build-whole-market-index.mjs /path/to/emb.zip

# Flurin17 Drive JSON → 2020–2021 segment, then merge
node scripts/build-flurin-index.mjs /path/to/flurin.json
node scripts/merge-market-index.mjs

# Daily: product ask snapshots + SPI extension point (keeps the series going past today)
npm run snapshot
```

```
src/
  app/          Next.js App Router pages + route handlers (must stay here)
  api/          Browser HTTP clients for /api/* endpoints
  charts/       Chart UI + chart range constants
  components/   Presentational UI (market, catalog, layout, alerts, compare)
  hooks/        React hooks (alerts storage, compare markets)
  lib/          Domain mappers + KicksDB infra (cache, client, logger)
  services/     Server-side catalog + market data orchestration
  types/        Shared TypeScript types
  utils/        Pure helpers (formatters, metric math)
  data/         Bootstrap history + ask snapshot JSON
```

Next.js requires API routes under `src/app/api/*`. Shared fetch helpers live in `src/api/*` so UI code does not call `fetch` ad hoc.

## Price history (database design)

Schema lives in [`db/schema.sql`](db/schema.sql) with scaling notes in [`db/README.md`](db/README.md).

Each snapshot stores: timestamp, lowest ask, highest bid, last sale, average sale, marketplace, and sneaker id — as an append-only Postgres fact table keyed by `(sneaker_id, marketplace, captured_at)`.

The app still reads JSON under `src/data/snapshots/` until a `DATABASE_URL` collector is wired.

## AI Market Summary

Rule-based narrative card on each sneaker page (`MarketSummaryCard`).

- Signals: price direction (30d / today / series) × inventory proxy (asks ÷ weekly orders)
- Playbook: `src/lib/summary/rules.ts` (e.g. price↑ + inventory↓ → “Demand appears to be increasing while supply is tightening.”)
- API: `GET /api/market/[slug]/summary`
- Generator flagged as `rules` today — ready to swap in an LLM composer later without changing the card contract

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TradingView Lightweight Charts
- [KicksDB](https://kicks.dev) StockX product API

## Routes

- `/` — live watchlist of the current top 100 StockX sellers
- `/sneakers/[slug]` — full market page for one SKU (top 100 or any StockX slug)
- `/compare` — side-by-side live quotes across the top 100
- `/alerts` — browser-stored price alerts + evaluate API
- `/api/market/[slug]` — JSON market payload
- `/api/catalog` — catalog quotes for the top sellers
- `/api/status` — upstream/cache health
- `/api/alerts/evaluate` — check alert thresholds

## Catalog (top 100 sellers)

The tracked set is **not** a hard-coded list. With `KICKSDB_API_KEY` set, the app loads:

```
GET /v3/stockx/products?market=US&limit=100&sort=rank&filters=product_type="sneakers"
```

Rank 1 = hottest by StockX sales. Catalog quotes, compare, alerts, and the daily snapshot job all use this list. Without an API key, a single offline fallback SKU is used.

## History priority

1. StockX daily sales (when KicksDB `sales/daily` is available)
2. Accumulated lowest-ask snapshots (`src/data/snapshots/[slug].json`)
3. Bootstrap series (`src/data/history/[slug].json`) — illustrative only

**Current price** is always live StockX lowest ask. Today/30d % change comes from sales or snapshots — never bootstrap.

## Metric definitions

| Metric | Meaning |
| --- | --- |
| Current price | Live StockX **lowest ask** across sizes |
| Today’s / 30-day change | From StockX **daily average sales** or **ask snapshots** (blank on bootstrap) |
| Weekly volume | StockX weekly orders when sales/snapshots are unavailable |
| Snapshot volume | Estimated from latest ask-snapshot point |
| Chart bootstrap | Illustrative — **not** official sales |
| Chart sales | Official StockX daily average sale series |
| Chart snapshots | Periodic lowest-ask snapshots from the daily job |

Canonical definitions live in `src/lib/market/definitions.ts`.

## Live StockX data

1. Create a free API key at [kicks.dev/register](https://kicks.dev/register)
2. Copy `.env.example` to `.env.local` and set:

```bash
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. Restart the development server

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — run Vitest unit tests
- `npm run snapshot` — append today’s lowest ask for each of the current top 100 sellers

## CI / snapshots

- `.github/workflows/ci.yml` — typecheck, test, lint, build
- `.github/workflows/snapshot.yml` — daily ask snapshots (needs `KICKSDB_API_KEY` secret)

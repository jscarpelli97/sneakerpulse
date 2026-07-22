# SneakerPulse

Next.js market app for tracked sneakers with live StockX data.

## Architecture

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

- `/` — catalog index of tracked sneakers
- `/sneakers/[slug]` — full market page for one SKU
- `/compare` — side-by-side live quotes
- `/alerts` — browser-stored price alerts + evaluate API
- `/api/market/[slug]` — JSON market payload
- `/api/catalog` — catalog quotes
- `/api/status` — upstream/cache health
- `/api/alerts/evaluate` — check alert thresholds

Add sneakers in `src/catalog/sneakers.ts`.

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
- `npm run snapshot` — append today’s lowest ask for each catalog SKU

## CI / snapshots

- `.github/workflows/ci.yml` — typecheck, test, lint, build
- `.github/workflows/snapshot.yml` — daily ask snapshots (needs `KICKSDB_API_KEY` secret)

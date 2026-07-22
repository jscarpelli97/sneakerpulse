# SneakerPulse

Next.js market app for tracked sneakers with live StockX data.

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

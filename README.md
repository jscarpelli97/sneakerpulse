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

Add sneakers in `src/catalog/sneakers.ts`. Optional bootstrap history lives in `src/data/history/[slug].json`.

## Metric definitions

| Metric | Meaning |
| --- | --- |
| Current price | Live StockX **lowest ask** across sizes |
| Today’s / 30-day change | From StockX **daily average sales** only (blank on bootstrap history) |
| Weekly volume | StockX weekly orders when sales history is unavailable |
| 24h volume | Latest daily sales pairs + notional when sales history exists |
| Chart bootstrap | Illustrative series anchored to StockX range/avg stats — **not** official sales |
| Chart sales | Official StockX daily average sale series |

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
- `npm test` — run Vitest unit tests

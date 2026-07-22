# SneakerPulse

Next.js market page for the **Jordan 1 High Dark Mocha (2020)** with live StockX data.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TradingView Lightweight Charts
- [KicksDB](https://kicks.dev) StockX product API

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

StockX blocks direct datacenter access, so pricing is loaded through KicksDB’s StockX endpoints.

1. Create a free API key at [kicks.dev/register](https://kicks.dev/register)
2. Copy `.env.example` to `.env.local` and set:

```bash
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. Restart the development server

Free tier covers live asks, stats, and size ladder. Daily sales history (trusted % change + sales chart) requires a paid KicksDB plan.

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

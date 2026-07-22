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

Sneaker-native market health index (ChronoPulse-inspired basket, different equation):

1. **Selection:** Up to **14 bestselling StockX brands** × **10 models** each (`spi-chrono-basket.json`).
2. **Calculation:** Volume-weighted **ask ÷ retail × 100**. **100 = at retail**, above 100 = premiums, below 100 = sitting under retail. Absolute-dollar Laspeyres stays “high” when retail prices rise and after the 2021 boom; premium vs retail matches how the market feels when everything is available near retail.
3. **Updates:** Daily via `npm run snapshot`. Basket rebalances every six months.

## Open data (daily SPI going forward)

Public dataset lives in [`open-data/`](open-data/) (CC0):

- `spi/daily.csv` / `daily.json` — append-only premium index  
- `spi/latest.json` — today’s tip  
- `spi/basket.json` — current brand × model basket  
- `members/YYYY-MM-DD.csv` — per-model ask / retail that day  

**Daily capture:** GitHub Action [`.github/workflows/daily-spi.yml`](.github/workflows/daily-spi.yml) runs `npm run snapshot` at **13:05 UTC** and commits updates. Add repo secret `KICKSDB_API_KEY`.

**Publish as its own GitHub repo** (so people can `curl` / clone just the data):

```bash
gh auth login
chmod +x scripts/publish-open-data-repo.sh
./scripts/publish-open-data-repo.sh yourname/sneakerpulse-index
```

Then others can:

```bash
curl -sL https://raw.githubusercontent.com/yourname/sneakerpulse-index/main/spi/daily.csv
```

Rebuild / extend:

```bash
# Flurin17 Drive JSON → premium history (optional rebuild)
# node scripts/build-flurin-index.mjs /path/to/flurin.json

# Daily: product ask snapshots + SPI premium point
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
- `/alerts` — browser-stored price alerts + evaluate API (no outbound webhooks)
- `/api/market/[slug]` — JSON market payload
- `/api/catalog` — catalog quotes for the top sellers
- `/api/status` — coarse upstream health (`live` / `degraded` / `offline`); details only with `STATUS_TOKEN`
- `/api/alerts/evaluate` — check alert thresholds in-process (webhooks disabled)

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

Canonical definitions live in `src/lib/definitions.ts`.

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

To put the site on the public internet, see **[DEPLOY.md](DEPLOY.md)**.

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
- `.github/workflows/daily-spi.yml` — daily ask snapshots + SPI open-data commit (needs `KICKSDB_API_KEY` secret)

## Preliminary public deploy notes

- Set `KICKSDB_API_KEY` in the host env (never commit it). Optional `STATUS_TOKEN` for detailed `/api/status`.
- `/api/catalog`, `/api/market/*`, and `/api/alerts/evaluate` are unauthenticated and will burn KicksDB quota if scraped — add edge rate limits (Vercel/Cloudflare) before wide traffic.
- SPI chart: historical premium tape ends Dec 2021; live daily tape starts mid-2026. Short ranges (1D–3M) only show live captures — they do not bridge the gap.

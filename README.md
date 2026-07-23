# SPI Markets

Next.js markets terminal for **sneaker** asks — StockX’s current top sellers, size ladders, portfolio, and the SPI premium-vs-retail index.

## Design standard

The **markets terminal** look from the homepage is the site-wide visual standard until explicitly changed:

- Dark surfaces (`dash-bg` / `dash-panel`), Syne + Instrument + Plex Mono
- Gold accent CTAs, teal/red for up/down
- `dash-card` panels, sticky terminal chrome, `max-w-[1400px]` shells
- Tokens and surfaces live in `src/app/globals.css` (`--dash-*`, `.dash-card`)
- Root layout applies the `dashboard` class by default; `SiteHeader` / `SiteFooter` use the terminal chrome

Do not reintroduce the old light ink/paper theme unless asked.

## SPI Index

Premium-vs-retail market health index (ChronoPulse-inspired sneaker basket):

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
./scripts/publish-open-data-repo.sh yourname/spi-markets-index
```

Then others can:

```bash
curl -sL https://raw.githubusercontent.com/yourname/spi-markets-index/main/spi/daily.csv
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

## Market read

Automated narrative card on each sneaker page (`MarketSummaryCard`).

- Signals: price direction (30d / today / series) × inventory proxy (asks ÷ weekly orders)
- Playbook: `src/lib/summary/rules.ts`
- API: `GET /api/market/[slug]/summary`

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TradingView Lightweight Charts
- [KicksDB](https://kicks.dev) StockX product API

## Routes

- `/` — homepage: hero, top 10 watchlist, SPI index
- `/markets` — full top-seller board with search and column sorting
- `/sneakers/[slug]` — market page (asks, size ladder, chart, market read)
- `/portfolio` — device-local collection tracker
- `/wardrobe` — closet + Fits boards (catalog sneakers + custom uploads)
- `/compare` — side-by-side quotes
- `/alerts` — browser-stored price thresholds
- `/about` — founder / data notes + contact form
- `/spi` — SPI index methodology
- `/api/market/[slug]` — JSON market payload
- `/api/catalog` — catalog quotes
- `/api/contact` — About contact form delivery
- `/api/status` — upstream health (`STATUS_TOKEN` for details)
- `/api/alerts/evaluate` — check alert thresholds (email is Plus-only)

## Catalog (top 500 sellers)

The tracked set is **not** a hard-coded list. With `KICKSDB_API_KEY` set, the app loads pages of:

```
GET /v3/stockx/products?market=US&limit=100&page=N&sort=rank&filters=product_type="sneakers"
```

until **500** sneakers are collected (homepage shows the top **10**; `/markets` lists all).

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

## Official StockX API (when approved)

When StockX issues credentials, paste them here or into Vercel env — the scaffold is ready:

| Env var | From StockX portal |
| --- | --- |
| `STOCKX_API_KEY` | Application `x-api-key` |
| `STOCKX_CLIENT_ID` | Application client id |
| `STOCKX_CLIENT_SECRET` | Application client secret |
| `STOCKX_REDIRECT_URI` | `https://spimarkets.com/api/stockx/callback` (register this URI) |
| `STOCKX_ACCESS_TOKEN` / `STOCKX_REFRESH_TOKEN` | After visiting `/api/stockx/auth` once |

Flow: set the first three → redeploy → open `/api/stockx/auth` → authorize → copy tokens from the callback JSON into Vercel → redeploy. Catalog wiring will map StockX `/v2/catalog/search` into the existing watchlist.

Until then the site runs in **free cached mode** from `src/data/catalog/top-sellers.json`.

## eBay comps (optional)

Market pages can show an **eBay comps** panel (toggleable in the UI). Off by default.

| Env var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_EBAY_PUBLIC` | `1` to show the panel |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` | eBay Browse API (client credentials) |
| `EBAY_ENV` | `production` (default) or `sandbox` |
| `EBAY_MARKETPLACE_ID` | Default `EBAY_US` |

Without Browse credentials the panel still appears in **link-only** mode (search URL). Users can Hide/Show eBay per browser via localStorage.

## Live StockX data (free path)

KicksDB **Free** is €0 / **1,000 requests per month** (Standard API, US market). That is enough if the site mostly reads a committed catalog and only refreshes once daily.

1. Sign up at [kicks.dev/register](https://kicks.dev/register) and open [API Keys](https://kicks.dev/api-keys) — you need **at least one active** free key (not an expired trial).
2. Set `KICKSDB_API_KEY` in `.env.local`, Vercel, and GitHub Actions.
3. Leave `KICKSDB_LIVE_READS` unset (or not `1`) so page views serve the offline catalog and do not burn quota. Set `KICKSDB_LIVE_READS=1` only when you intentionally want live page reads.
4. Run `npm run snapshot` (or wait for `daily-spi.yml`) — that updates `src/data/catalog/top-sellers.json`.

If the key is inactive/missing, or live page reads are off, SPI Markets still runs in **free cached mode** from `src/data/catalog/top-sellers.json` (asks labeled Cached).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To put the site on the public internet, see **[DEPLOY.md](DEPLOY.md)**.

## Install as an app (PWA)

SPI Markets is installable from the browser:

- **Android / Chrome / Edge:** use the Install banner, or menu → **Install app**
- **iPhone / iPad (Safari):** Share → **Add to Home Screen**

Manifest: `/manifest.webmanifest` · service worker: `/sw.js` · icons under `/icons/`.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — run Vitest unit tests
- `npm run snapshot` — append today’s lowest ask for each of the current top 500 sellers

## CI / snapshots

- `.github/workflows/ci.yml` — typecheck, test, lint, build
- `.github/workflows/daily-spi.yml` — daily ask snapshots + SPI open-data commit (needs `KICKSDB_API_KEY` secret)

## Preliminary public deploy notes

- Set `KICKSDB_API_KEY` in the host env (never commit it). Optional `STATUS_TOKEN` for detailed `/api/status`.
- `/api/catalog`, `/api/market/*`, and `/api/alerts/evaluate` are unauthenticated and will burn KicksDB quota if scraped — add edge rate limits (Vercel/Cloudflare) before wide traffic.
- SPI chart: historical premium tape ends Dec 2021; live daily tape starts mid-2026. Short ranges (1D–3M) only show live captures — they do not bridge the gap.

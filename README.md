# SneakerPulse

Next.js market page for the **Jordan 1 High Dark Mocha (2020)** with live StockX data.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- [KicksDB](https://kicks.dev) StockX product API

## Live StockX data

StockX blocks direct datacenter access, so pricing is loaded through KicksDB’s StockX endpoints.

1. Create a free API key at [kicks.dev/register](https://kicks.dev/register)
2. Copy `.env.example` to `.env.local` and set:

```bash
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. Restart the dev server

Free tier covers live lowest/avg/highest asks and size-level asks. Daily sales history (chart + day/30d change) requires a paid KicksDB plan.

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

#!/usr/bin/env node
/**
 * Merge embSneakers (2012–2020) + Flurin17 (2020–2021) into one SPI series.
 *
 * - Holds Jul→Nov 2020 at the last emb level (no public daily feed)
 * - Rebases Flurin onto that level so the chain stays continuous
 *
 * Usage:
 *   node scripts/merge-market-index.mjs
 *
 * Output: src/data/index/stockx-whole-market-2012-2021.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const embPath = path.join(
  ROOT,
  "src/data/index/stockx-whole-market-2012-2020.json",
);
const flurinPath = path.join(
  ROOT,
  "src/data/index/stockx-flurin-2020-2021.json",
);
const outPath = path.join(
  ROOT,
  "src/data/index/stockx-whole-market-2012-2021.json",
);

const emb = JSON.parse(fs.readFileSync(embPath, "utf8"));
const flurin = JSON.parse(fs.readFileSync(flurinPath, "utf8"));

const embPts = emb.points ?? [];
const flurinPts = flurin.points ?? [];
if (embPts.length < 2 || flurinPts.length < 2) {
  console.error("Missing emb or flurin points");
  process.exit(1);
}

const embEnd = embPts[embPts.length - 1];
const flurinStart = flurinPts[0];

function parseDay(date) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

const bridge = [];
for (
  let ms = parseDay(embEnd.date) + 86_400_000;
  ms < parseDay(flurinStart.date);
  ms += 86_400_000
) {
  bridge.push({ date: formatDay(ms), price: embEnd.price, orders: 0 });
}

const scale = embEnd.price / flurinStart.price;
const flurinReb = flurinPts.map((p) => ({
  date: p.date.slice(0, 10),
  price: Math.round(p.price * scale * 100) / 100,
  orders: p.orders ?? 0,
}));

const byDate = new Map();
for (const p of embPts) byDate.set(p.date.slice(0, 10), p);
for (const p of bridge) byDate.set(p.date, p);
for (const p of flurinReb) byDate.set(p.date, p);

const merged = [...byDate.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([, p]) => ({
    date: p.date.slice(0, 10),
    price: p.price,
    orders: p.orders ?? 0,
  }));

const peak = merged.reduce((best, p) => (p.price > best.price ? p : best));

const payload = {
  id: "stockx-whole-market-2012-2021",
  name: "SneakerPulse Market Index",
  source: "embsneakers_plus_flurin17",
  note: "ChronoPulse-style chained Laspeyres whole StockX market index. Apr 2012–Jul 2020: embSneakers monthly top-200 by sales (LOCF daily). Aug–Nov 2020: level held (no public daily feed). Nov 2020–Dec 2021: Flurin17 daily top-200 by cumulative sales, lowestAsk, rebased onto the emb series. Base=1000 in Apr 2012. Gap remains Jan 2022 until live daily extension resumes.",
  baseLevel: 1000,
  baseDate: merged[0].date,
  asOf: merged[merged.length - 1].date,
  constituents: 200,
  productsCovered: Math.max(
    emb.productsCovered ?? 0,
    flurin.productsCovered ?? 0,
  ),
  citation: "https://github.com/embSneakers/embSneakers",
  citations: [
    "https://github.com/embSneakers/embSneakers",
    "https://github.com/Flurin17/stockXsalesData",
  ],
  paper: emb.paper ?? null,
  resolution: "hybrid_monthly_locf_and_daily",
  segments: [
    { id: "embsneakers", from: emb.baseDate, to: emb.asOf },
    {
      id: "hold_bridge",
      from: bridge[0]?.date ?? null,
      to: bridge.at(-1)?.date ?? null,
      method: "locf_hold",
    },
    {
      id: "flurin17",
      from: flurinReb[0].date,
      to: flurinReb.at(-1).date,
      method: "daily_laspeyres_lowest_ask",
      rebaseScale: scale,
    },
  ],
  gapAfter: merged.at(-1).date,
  peakLevel: peak.price,
  peakDate: peak.date,
  points: merged,
};

fs.writeFileSync(outPath, `${JSON.stringify(payload)}\n`);
console.log(
  `wrote ${path.relative(ROOT, outPath)} points=${merged.length} ${merged[0].date}→${merged.at(-1).date} peak=${peak.price} @ ${peak.date}`,
);

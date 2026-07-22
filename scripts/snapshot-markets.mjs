#!/usr/bin/env node
/**
 * Daily snapshot job:
 * 1) Append today's lowest ask for every top StockX seller
 * 2) Append today's SPI level (chained Laspeyres on that basket)
 *
 * Usage:
 *   npm run snapshot
 *   KICKSDB_API_KEY=... node scripts/snapshot-markets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOP_SELLERS_LIMIT = 100;
const HIST_END_LEVEL = 5304.94;
const HIST_END_DATE = "2021-12-26";

async function loadEnvLocal() {
  if (process.env.KICKSDB_API_KEY?.trim()) return;
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

await loadEnvLocal();

const API_KEY = process.env.KICKSDB_API_KEY?.trim();
const BASE = "https://api.kicks.dev/v3";

async function fetchTopSellers() {
  const query = new URLSearchParams({
    market: "US",
    limit: String(TOP_SELLERS_LIMIT),
    sort: "rank",
    filters: 'product_type="sneakers"',
  });
  const res = await fetch(`${BASE}/stockx/products?${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`top sellers -> ${res.status} ${body.slice(0, 200)}`);
  }
  const json = JSON.parse(body);
  return (json.data ?? []).filter((p) => p?.slug);
}

async function upsertSnapshot(product) {
  const slug = product.slug;
  const file = path.join(ROOT, "src/data/snapshots", `${slug}.json`);
  let current = {
    productId: product.id,
    slug,
    source: "snapshot",
    note: "Daily lowest-ask snapshots. Prefer StockX sales/daily when available.",
    updatedAt: new Date().toISOString(),
    points: [],
  };
  try {
    current = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    // new file
  }

  const today = new Date().toISOString().slice(0, 10);
  const price = product.min_price ?? product.avg_price ?? null;
  if (price == null) {
    console.warn(`skip ${slug}: no price`);
    return;
  }
  const orders = Math.max(1, Math.round((product.weekly_orders ?? 7) / 7));
  const points = (current.points ?? []).filter(
    (p) => p.date.slice(0, 10) !== today,
  );
  points.push({ date: today, price, orders });
  points.sort((a, b) => a.date.localeCompare(b.date));

  const next = {
    ...current,
    productId: product.id,
    slug,
    source: "snapshot",
    updatedAt: new Date().toISOString(),
    points,
  };
  await fs.writeFile(file, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `wrote #${product.rank ?? "?"} ${slug}: ${points.length} points, today=${price}`,
  );
}

function memberWeight(product, index) {
  return Math.max(
    1,
    product.weekly_orders ?? Math.max(1, TOP_SELLERS_LIMIT - index),
  );
}

function chainLaspeyres(prevLevel, prevMembers, nextMembers) {
  const basket = [];
  for (const [id, next] of Object.entries(nextMembers)) {
    const prev = prevMembers[id];
    if (!prev || !(prev.price > 0) || !(next.price > 0)) continue;
    basket.push({
      weight: Math.max(1, next.weight || prev.weight || 1),
      ratio: next.price / prev.price,
    });
  }
  if (basket.length < 10) {
    console.warn(
      `SPI: only ${basket.length} overlapping members — holding level`,
    );
    return prevLevel;
  }
  const den = basket.reduce((s, b) => s + b.weight, 0);
  const num = basket.reduce((s, b) => s + b.weight * b.ratio, 0);
  return prevLevel * (num / den);
}

async function upsertSpiExtension(products) {
  const today = new Date().toISOString().slice(0, 10);
  const extensionPath = path.join(
    ROOT,
    "src/data/index/spi-daily-extension.json",
  );
  const statePath = path.join(ROOT, "src/data/index/spi-basket-state.json");

  let extension = {
    id: "spi-daily-extension",
    name: "SneakerPulse Index daily extension",
    source: "kicksdb_top_sellers_laspeyres",
    note: "Append-only daily SPI continuation from live top StockX sellers (lowest ask, weekly_orders weights). Anchored to the last historical SPI level on the first recorded day so the long series can resume after the Jan 2022–present public-data gap. Run: npm run snapshot",
    anchorDate: HIST_END_DATE,
    anchorLevel: HIST_END_LEVEL,
    baseLevel: HIST_END_LEVEL,
    asOf: null,
    constituents: TOP_SELLERS_LIMIT,
    gapBefore: "2022-01-01",
    points: [],
  };
  try {
    extension = JSON.parse(await fs.readFile(extensionPath, "utf8"));
  } catch {
    // defaults
  }

  let state = {
    date: null,
    level: null,
    members: {},
    previousDate: null,
    previousLevel: null,
    previousMembers: {},
  };
  try {
    state = { ...state, ...JSON.parse(await fs.readFile(statePath, "utf8")) };
  } catch {
    // defaults
  }

  const members = {};
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const price = product.min_price ?? product.avg_price ?? null;
    if (price == null || !(price > 0)) continue;
    members[product.slug] = {
      price,
      weight: memberWeight(product, i),
    };
  }

  const memberCount = Object.keys(members).length;
  if (memberCount < 10) {
    console.warn(`SPI skip: only ${memberCount} priced members`);
    return;
  }

  const anchor = extension.anchorLevel ?? HIST_END_LEVEL;
  let level;
  let previousDate = state.previousDate ?? null;
  let previousLevel = state.previousLevel ?? null;
  let previousMembers = state.previousMembers ?? {};

  if (state.level == null || !Object.keys(state.members ?? {}).length) {
    level = anchor;
    console.log(
      `SPI seed: anchoring first day ${today} at historical end level ${level}`,
    );
  } else if (state.date === today) {
    const prior = state.previousMembers ?? {};
    if (
      state.previousLevel != null &&
      Object.keys(prior).length >= 10
    ) {
      level = chainLaspeyres(state.previousLevel, prior, members);
    } else {
      level = state.level;
    }
    previousDate = state.previousDate ?? null;
    previousLevel = state.previousLevel ?? null;
    previousMembers = prior;
  } else {
    level = chainLaspeyres(state.level, state.members, members);
    previousDate = state.date;
    previousLevel = state.level;
    previousMembers = state.members;
  }

  const points = (extension.points ?? []).filter(
    (p) => p.date.slice(0, 10) !== today,
  );
  points.push({
    date: today,
    price: Math.round(level * 100) / 100,
    orders: memberCount,
  });
  points.sort((a, b) => a.date.localeCompare(b.date));

  const nextExtension = {
    ...extension,
    anchorDate: extension.anchorDate ?? HIST_END_DATE,
    anchorLevel: anchor,
    baseLevel: extension.baseLevel ?? anchor,
    asOf: today,
    constituents: TOP_SELLERS_LIMIT,
    updatedAt: new Date().toISOString(),
    points,
  };

  const nextState = {
    date: today,
    level: Math.round(level * 100) / 100,
    members,
    previousDate,
    previousLevel,
    previousMembers,
  };

  await fs.writeFile(
    extensionPath,
    `${JSON.stringify(nextExtension, null, 2)}\n`,
  );
  await fs.writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
  console.log(
    `SPI extension: ${points.length} points, today=${nextState.level} (members=${memberCount})`,
  );
}

async function main() {
  if (!API_KEY) {
    console.error("KICKSDB_API_KEY is required");
    process.exit(1);
  }

  const products = await fetchTopSellers();
  console.log(`snapshotting ${products.length} top StockX sellers`);

  for (const product of products) {
    try {
      await upsertSnapshot(product);
      await new Promise((r) => setTimeout(r, 50));
    } catch (error) {
      console.error(
        product.slug,
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    await upsertSpiExtension(products);
  } catch (error) {
    console.error(
      "SPI extension failed",
      error instanceof Error ? error.message : error,
    );
  }
}

main();

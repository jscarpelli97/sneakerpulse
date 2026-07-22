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
    "display[traits]": "true",
    "display[statistics]": "true",
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

const SPI_BRAND_COUNT = 14;
const SPI_MODELS_PER_BRAND = 10;
const SPI_REBALANCE_MONTHS = 6;

function addMonths(isoDay, months) {
  const [y, m, d] = isoDay.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

function selectChronoBasket(products, previous, rebalancedAt) {
  const byBrand = new Map();
  for (const product of products) {
    if (!product.slug) continue;
    const brand = (product.brand || "Unknown").trim() || "Unknown";
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand).push(product);
  }
  const brandTotals = [...byBrand.entries()]
    .map(([brand, items]) => ({
      brand,
      items: items
        .slice()
        .sort(
          (a, b) =>
            (b.weekly_orders || 0) - (a.weekly_orders || 0) ||
            (a.rank ?? 999) - (b.rank ?? 999),
        ),
      weight: items.reduce((sum, item) => sum + (item.weekly_orders || 0), 0),
    }))
    .sort((a, b) => b.weight - a.weight || a.brand.localeCompare(b.brand))
    .slice(0, SPI_BRAND_COUNT);

  const members = [];
  const brands = [];
  for (const row of brandTotals) {
    const picked = row.items.slice(0, SPI_MODELS_PER_BRAND);
    let brandWeight = 0;
    for (const product of picked) {
      const weight = Math.max(1, product.weekly_orders || 0);
      brandWeight += weight;
      members.push({
        slug: product.slug,
        brand: row.brand,
        name: product.title || product.slug,
        weight,
        rank: product.rank ?? null,
      });
    }
    brands.push({ brand: row.brand, models: picked.length, weight: brandWeight });
  }

  const prevSlugs = new Set((previous?.members ?? []).map((m) => m.slug));
  const nextSlugs = new Set(members.map((m) => m.slug));
  const added = members.map((m) => m.slug).filter((s) => !prevSlugs.has(s));
  const removed = [...prevSlugs].filter((s) => !nextSlugs.has(s));
  const prevChanges = previous?.changes ?? [];
  const changes =
    previous && (added.length || removed.length)
      ? [...prevChanges, { date: rebalancedAt, added, removed }].slice(-12)
      : prevChanges;

  return {
    id: "spi-chronopulse-basket",
    name: "SneakerPulse ChronoPulse basket",
    methodology: "chronopulse_laspeyres",
    brandCount: brands.length,
    modelsPerBrand: SPI_MODELS_PER_BRAND,
    rebalancedAt,
    nextRebalanceAt: addMonths(rebalancedAt, SPI_REBALANCE_MONTHS),
    members,
    brands,
    changes,
  };
}

async function loadOrRebalanceBasket(products, today) {
  const basketPath = path.join(ROOT, "src/data/index/spi-chrono-basket.json");
  let previous = null;
  try {
    previous = JSON.parse(await fs.readFile(basketPath, "utf8"));
  } catch {
    // new
  }
  const due =
    !previous?.members?.length ||
    !previous.nextRebalanceAt ||
    today >= previous.nextRebalanceAt.slice(0, 10);
  const basket = due
    ? selectChronoBasket(products, previous, today)
    : previous;
  if (due) {
    await fs.writeFile(basketPath, `${JSON.stringify(basket, null, 2)}\n`);
    console.log(
      `SPI basket rebalanced: ${basket.brandCount} brands, ${basket.members.length} models, next=${basket.nextRebalanceAt}`,
    );
  }
  return basket;
}

function memberWeight(product, index, frozenWeight) {
  if (frozenWeight != null) return Math.max(1, frozenWeight);
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
  const chronoBasket = await loadOrRebalanceBasket(products, today);
  const weightBySlug = new Map(
    chronoBasket.members.map((m) => [m.slug, m.weight]),
  );
  const allowed = new Set(weightBySlug.keys());

  let extension = {
    id: "spi-daily-extension",
    name: "SneakerPulse Index daily extension",
    source: "chronopulse_laspeyres",
    note: "Append-only daily SPI continuation on the ChronoPulse-style brand×model basket (lowest ask, frozen rebalance weights). Anchored to the last historical SPI level on the first recorded day.",
    anchorDate: HIST_END_DATE,
    anchorLevel: HIST_END_LEVEL,
    baseLevel: HIST_END_LEVEL,
    asOf: null,
    constituents: chronoBasket.members.length,
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
    if (!product.slug || !allowed.has(product.slug)) continue;
    const price = product.min_price ?? product.avg_price ?? null;
    if (price == null || !(price > 0)) continue;
    members[product.slug] = {
      price,
      weight: memberWeight(product, i, weightBySlug.get(product.slug)),
    };
  }

  const memberCount = Object.keys(members).length;
  if (memberCount < 10) {
    console.warn(`SPI skip: only ${memberCount} priced ChronoPulse members`);
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
    if (state.previousLevel != null && Object.keys(prior).length >= 10) {
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
    source: "chronopulse_laspeyres",
    anchorDate: extension.anchorDate ?? HIST_END_DATE,
    anchorLevel: anchor,
    baseLevel: extension.baseLevel ?? anchor,
    asOf: today,
    constituents: memberCount,
    brandCount: chronoBasket.brandCount,
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
    `SPI extension: ${points.length} points, today=${nextState.level} (chrono members=${memberCount}/${chronoBasket.members.length})`,
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

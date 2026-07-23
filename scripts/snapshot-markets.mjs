#!/usr/bin/env node
/**
 * Daily snapshot job:
 * 1) Append today's lowest ask for every top StockX seller
 * 2) Append today's SPI level (volume-weighted ask÷retail×100 on ChronoPulse basket)
 *
 * Usage:
 *   npm run snapshot
 *   KICKSDB_API_KEY=... node scripts/snapshot-markets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOP_SELLERS_LIMIT = 500;
const PAGE_SIZE = 100;
const PREMIUM_BASE = 100;

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
const MONTHLY_LIMIT = Number(process.env.KICKSDB_MONTHLY_LIMIT ?? "1000") || 1000;

async function recordSnapshotQuota(pages) {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || pages <= 0) return;
  try {
    const pg = await import("pg");
    const local =
      url.includes("localhost") ||
      url.includes("127.0.0.1") ||
      url.includes("@postgres:");
    const client = new pg.default.Client({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
    });
    await client.connect();
    const month = new Date().toISOString().slice(0, 7);
    const { rows } = await client.query(
      `INSERT INTO kicks_quota (month_key, used, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (month_key) DO UPDATE SET
         used = kicks_quota.used + EXCLUDED.used,
         updated_at = now()
       RETURNING used`,
      [month, pages],
    );
    console.log(
      `KicksDB quota ${month}: ${rows[0]?.used ?? "?"}/${MONTHLY_LIMIT} (snapshot +${pages})`,
    );
    await client.end();
  } catch (err) {
    console.warn("Could not record KicksDB quota:", err?.message ?? err);
  }
}

async function fetchTopSellers() {
  const products = [];
  let pagesFetched = 0;
  for (let page = 1; products.length < TOP_SELLERS_LIMIT && page <= 20; page += 1) {
    const query = new URLSearchParams({
      market: "US",
      limit: String(PAGE_SIZE),
      page: String(page),
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
    pagesFetched += 1;
    if (!res.ok) {
      throw new Error(`top sellers page ${page} -> ${res.status} ${body.slice(0, 200)}`);
    }
    const json = JSON.parse(body);
    const batch = (json.data ?? []).filter((p) => p?.slug);
    if (!batch.length) break;
    products.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  await recordSnapshotQuota(pagesFetched);
  return products.slice(0, TOP_SELLERS_LIMIT);
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

function parseRetail(product) {
  const traits = product.traits ?? [];
  const hit = traits.find(
    (t) => String(t.trait || "").toLowerCase() === "retail price",
  );
  if (!hit?.value) return null;
  const n = Number(String(hit.value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function measurePremium(products, chronoBasket) {
  const weightBySlug = new Map(
    chronoBasket.members.map((m) => [m.slug, m.weight]),
  );
  let num = 0;
  let den = 0;
  let count = 0;
  let atOrBelow = 0;
  const memberRows = [];
  for (const product of products) {
    if (!product.slug || !weightBySlug.has(product.slug)) continue;
    const ask = product.min_price ?? product.avg_price ?? null;
    const retail = parseRetail(product);
    if (!(ask > 0) || !(retail > 0)) continue;
    const weight = Math.max(1, weightBySlug.get(product.slug) || 1);
    const ratio = ask / retail;
    num += weight * ratio;
    den += weight;
    count += 1;
    if (ratio <= 1) atOrBelow += 1;
    const meta = chronoBasket.members.find((m) => m.slug === product.slug);
    memberRows.push({
      slug: product.slug,
      brand: meta?.brand ?? product.brand ?? "",
      name: meta?.name ?? product.title ?? product.slug,
      ask,
      retail,
      ratio: Math.round(ratio * 10000) / 10000,
      weight,
      rank: product.rank ?? meta?.rank ?? "",
    });
  }
  if (!(den > 0) || count < 3) return null;
  const level = Math.round(((PREMIUM_BASE * num) / den) * 100) / 100;
  return { level, count, atOrBelow, memberRows };
}

async function upsertSpiExtension(products) {
  const today = new Date().toISOString().slice(0, 10);
  const extensionPath = path.join(
    ROOT,
    "src/data/index/spi-daily-extension.json",
  );
  const statePath = path.join(ROOT, "src/data/index/spi-basket-state.json");
  const chronoBasket = await loadOrRebalanceBasket(products, today);
  const measured = measurePremium(products, chronoBasket);
  if (!measured) {
    console.warn("SPI premium skip: not enough ask/retail pairs");
    return;
  }

  let extension = {
    id: "spi-daily-extension",
    name: "SneakerPulse Premium Index daily extension",
    source: "premium_vs_retail",
    note: "Daily volume-weighted ask/retail × 100 for the ChronoPulse-style basket. 100 = retail parity.",
    baseLevel: PREMIUM_BASE,
    asOf: null,
    constituents: measured.count,
    gapBefore: "2022-01-01",
    points: [],
  };
  try {
    extension = JSON.parse(await fs.readFile(extensionPath, "utf8"));
  } catch {
    // defaults
  }

  const points = (extension.points ?? []).filter(
    (p) => p.date.slice(0, 10) !== today,
  );
  // Drop old absolute-dollar seed points (~5000) if present from prior methodology.
  const cleaned = points.filter((p) => p.price > 0 && p.price < 500);
  cleaned.push({
    date: today,
    price: measured.level,
    orders: measured.count,
  });
  cleaned.sort((a, b) => a.date.localeCompare(b.date));

  const nextExtension = {
    ...extension,
    source: "premium_vs_retail",
    baseLevel: PREMIUM_BASE,
    asOf: today,
    constituents: measured.count,
    brandCount: chronoBasket.brandCount,
    atOrBelowRetail: measured.atOrBelow,
    updatedAt: new Date().toISOString(),
    points: cleaned,
  };

  const nextState = {
    date: today,
    level: measured.level,
    atOrBelowRetail: measured.atOrBelow,
    constituents: measured.count,
  };

  await fs.writeFile(
    extensionPath,
    `${JSON.stringify(nextExtension, null, 2)}\n`,
  );
  await fs.writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
  console.log(
    `SPI premium: ${cleaned.length} points, today=${measured.level} (${measured.atOrBelow}/${measured.count} ≤ retail)`,
  );

  const { exportOpenData } = await import("./export-open-data.mjs");
  await exportOpenData({
    today,
    level: measured.level,
    constituents: measured.count,
    atOrBelowRetail: measured.atOrBelow,
    brandCount: chronoBasket.brandCount,
    basket: chronoBasket,
    memberRows: measured.memberRows,
    historyPoints: cleaned.map((p) => ({
      ...p,
      at_or_below_retail:
        p.date === today ? measured.atOrBelow : undefined,
      brand_count: chronoBasket.brandCount,
    })),
  });
}

async function writeOfflineCatalog(products) {
  function traitValue(traits, name) {
    const hit = traits?.find(
      (t) => String(t.trait || "").toLowerCase() === name.toLowerCase(),
    );
    const value = hit?.value?.trim();
    return value || null;
  }

  function tickerFor(product) {
    const sku = product.sku?.trim();
    if (sku) {
      return sku.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || sku;
    }
    if (product.rank != null) return `TOP${product.rank}`;
    const slug = product.slug ?? product.id;
    return String(slug).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
  }

  const now = new Date().toISOString();
  const mapped = [];
  for (const [index, product] of products.entries()) {
    const slug = product.slug?.trim();
    if (!slug) continue;
    const releaseDate =
      traitValue(product.traits, "Release Date") ??
      `${new Date().getUTCFullYear()}-01-01`;
    const yearMatch = releaseDate.match(/^(\d{4})/);
    const retailRaw = traitValue(product.traits, "Retail Price");
    const retail = retailRaw
      ? Number(String(retailRaw).replace(/[^0-9.]/g, ""))
      : product.avg_price ?? product.min_price ?? 0;
    mapped.push({
      slug,
      ticker: tickerFor(product),
      styleCode: product.sku || slug,
      name: product.title || slug,
      brand: product.brand || "Unknown",
      year: yearMatch ? Number(yearMatch[1]) : new Date().getUTCFullYear(),
      releaseDate,
      colorway: traitValue(product.traits, "Colorway") ?? "—",
      retail: Number.isFinite(retail) ? retail : 0,
      stockxUrl: product.link || `https://stockx.com/${slug}`,
      fallbackImage: product.image || "",
      featured: (product.rank ?? index + 1) === 1,
      rank: product.rank ?? index + 1,
      price: product.min_price ?? product.avg_price ?? null,
      weeklyOrders: product.weekly_orders ?? null,
      live: true,
      capturedAt: now,
    });
  }

  mapped.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
  const out = {
    source: "kicksdb_stockx_top_sellers",
    note: "Free-tier offline catalog. Refreshed by npm run snapshot. Site serves this when live API key is inactive.",
    asOf: now.slice(0, 10),
    updatedAt: now,
    count: mapped.length,
    products: mapped,
  };
  const dest = path.join(ROOT, "src/data/catalog/top-sellers.json");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote offline catalog: ${mapped.length} products -> ${dest}`);
}

async function main() {
  if (!API_KEY) {
    console.error("KICKSDB_API_KEY is required");
    process.exit(1);
  }

  const products = await fetchTopSellers();
  console.log(`snapshotting ${products.length} top StockX sellers`);

  // Free-tier friendly: rewrite the committed offline catalog so the site
  // can serve asks without burning request quota on every page view.
  await writeOfflineCatalog(products);

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

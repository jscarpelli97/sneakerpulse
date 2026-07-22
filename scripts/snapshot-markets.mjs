#!/usr/bin/env node
/**
 * Daily snapshot job: append today's lowest ask for every top StockX seller.
 * Usage:
 *   npm run snapshot
 *   KICKSDB_API_KEY=... node scripts/snapshot-markets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOP_SELLERS_LIMIT = 100;

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
}

main();

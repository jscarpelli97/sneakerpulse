#!/usr/bin/env node
/**
 * Daily snapshot job: append today's lowest ask for every catalog sneaker.
 * Usage:
 *   npm run snapshot
 *   KICKSDB_API_KEY=... node scripts/snapshot-markets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

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

const SLUGS = [
  "air-jordan-1-retro-high-dark-mocha",
  "air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found",
  "nike-dunk-low-retro-white-black-2021",
  "adidas-samba-og-cloud-white-core-black",
];

async function fetchProduct(slug) {
  const query = new URLSearchParams({ market: "US" });
  const res = await fetch(`${BASE}/stockx/products/${slug}?${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${slug} -> ${res.status} ${body.slice(0, 200)}`);
  }
  return JSON.parse(body).data;
}

async function upsertSnapshot(slug, product) {
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
  console.log(`wrote ${slug}: ${points.length} points, today=${price}`);
}

async function main() {
  if (!API_KEY) {
    console.error("KICKSDB_API_KEY is required");
    process.exit(1);
  }
  for (const slug of SLUGS) {
    try {
      const product = await fetchProduct(slug);
      await upsertSnapshot(slug, product);
      await new Promise((r) => setTimeout(r, 350));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }
}

main();

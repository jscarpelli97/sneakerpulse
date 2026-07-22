#!/usr/bin/env node
/**
 * Write the public open-data/ package from today's SPI measure + basket.
 * Called by scripts/snapshot-markets.mjs; can also run standalone after a snapshot.
 *
 * Usage:
 *   node scripts/export-open-data.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OPEN = path.join(ROOT, "open-data");
const SPI_DIR = path.join(OPEN, "spi");
const MEMBERS_DIR = path.join(OPEN, "members");

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export async function exportOpenData(input) {
  const {
    today,
    level,
    constituents,
    atOrBelowRetail,
    brandCount,
    basket,
    memberRows,
    historyPoints,
  } = input;

  await fs.mkdir(SPI_DIR, { recursive: true });
  await fs.mkdir(MEMBERS_DIR, { recursive: true });

  const point = {
    date: today,
    spi: level,
    premium_pct: Math.round((level - 100) * 100) / 100,
    constituents,
    at_or_below_retail: atOrBelowRetail,
    brand_count: brandCount,
  };

  // Merge into history (prefer richer historyPoints from app extension).
  const byDate = new Map();
  for (const p of historyPoints ?? []) {
    if (!(p.price > 0) || p.price >= 500 || !p.date) continue;
    byDate.set(p.date.slice(0, 10), {
      date: p.date.slice(0, 10),
      spi: p.price,
      premium_pct: Math.round((p.price - 100) * 100) / 100,
      constituents: p.orders ?? constituents,
      at_or_below_retail: p.at_or_below_retail ?? "",
      brand_count: p.brand_count ?? brandCount ?? "",
    });
  }
  byDate.set(today, point);
  const daily = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const dailyJson = {
    id: "sneakerpulse-premium-index",
    name: "SneakerPulse Index (SPI)",
    base: 100,
    base_meaning: "retail_parity",
    unit: "ask_over_retail_x100",
    updated_at: new Date().toISOString(),
    as_of: today,
    points: daily,
  };

  const latest = {
    ...point,
    updated_at: new Date().toISOString(),
    base: 100,
    base_meaning: "retail_parity",
    note: "Volume-weighted ask/retail × 100 for the ChronoPulse-style basket.",
  };

  await fs.writeFile(
    path.join(SPI_DIR, "daily.json"),
    `${JSON.stringify(dailyJson, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(SPI_DIR, "daily.csv"),
    rowsToCsv(
      [
        "date",
        "spi",
        "premium_pct",
        "constituents",
        "at_or_below_retail",
        "brand_count",
      ],
      daily,
    ),
  );
  await fs.writeFile(
    path.join(SPI_DIR, "latest.json"),
    `${JSON.stringify(latest, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(SPI_DIR, "basket.json"),
    `${JSON.stringify(basket, null, 2)}\n`,
  );

  if (memberRows?.length) {
    await fs.writeFile(
      path.join(MEMBERS_DIR, `${today}.csv`),
      rowsToCsv(
        ["slug", "brand", "name", "ask", "retail", "ratio", "weight", "rank"],
        memberRows,
      ),
    );
  }

  console.log(
    `open-data: ${daily.length} SPI days, latest=${level} → ${path.relative(ROOT, OPEN)}`,
  );
}

// CLI
import { pathToFileURL } from "node:url";
const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const extensionPath = path.join(
    ROOT,
    "src/data/index/spi-daily-extension.json",
  );
  const basketPath = path.join(ROOT, "src/data/index/spi-chrono-basket.json");
  const extension = JSON.parse(await fs.readFile(extensionPath, "utf8"));
  const basket = JSON.parse(await fs.readFile(basketPath, "utf8"));
  const tip = extension.points?.at(-1);
  if (!tip) {
    console.error("No SPI extension points — run npm run snapshot first");
    process.exit(1);
  }
  await exportOpenData({
    today: tip.date.slice(0, 10),
    level: tip.price,
    constituents: extension.constituents ?? tip.orders ?? basket.members.length,
    atOrBelowRetail: extension.atOrBelowRetail ?? "",
    brandCount: extension.brandCount ?? basket.brandCount,
    basket,
    memberRows: [],
    historyPoints: extension.points,
  });
}

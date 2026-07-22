#!/usr/bin/env node
/**
 * Rebuild the long-run StockX Contest index JSON from the official 2019 sample.
 *
 * Download once:
 *   curl -L -o /tmp/stockx-contest.csv \
 *     https://raw.githubusercontent.com/saromleang/stockx-dc19/master/StockX-Data-Contest-2019-3.csv
 *
 * Then:
 *   node scripts/build-stockx-contest-index.mjs /tmp/stockx-contest.csv
 */
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/build-stockx-contest-index.mjs <contest.csv>");
  process.exit(1);
}

const raw = fs.readFileSync(input, "utf8");
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(",");
const idx = Object.fromEntries(header.map((key, i) => [key.trim(), i]));

function parseDate(value) {
  const v = value.trim();
  for (const fmt of [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ]) {
    const m = v.match(fmt);
    if (!m) continue;
    const month = Number(m[1]);
    const day = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

const bySneakerDay = new Map();
const salesByDay = new Map();

for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  // CSV is simple enough here (no embedded commas in contested fields except names with hyphens)
  const cols = line.split(",");
  const day = parseDate(cols[idx["Order Date"]]);
  const name = cols[idx["Sneaker Name"]]?.trim();
  const sale = Number(String(cols[idx["Sale Price"]]).replace(/[$,]/g, ""));
  if (!day || !name || !(sale > 0)) continue;
  const key = `${name}||${day}`;
  if (!bySneakerDay.has(key)) bySneakerDay.set(key, []);
  bySneakerDay.get(key).push(sale);
  salesByDay.set(day, (salesByDay.get(day) ?? 0) + 1);
}

const sneakerSeries = new Map();
for (const [key, prices] of bySneakerDay) {
  const [name, day] = key.split("||");
  prices.sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  if (!sneakerSeries.has(name)) sneakerSeries.set(name, new Map());
  sneakerSeries.get(name).set(day, median);
}

const allDays = [...new Set([...salesByDay.keys()])].sort();
const bases = new Map();
for (const [name, series] of sneakerSeries) {
  const first = [...series.keys()].sort()[0];
  bases.set(name, series.get(first));
}

const last = new Map();
const points = [];
const BASE_LEVEL = 1000;

for (const day of allDays) {
  for (const [name, series] of sneakerSeries) {
    if (series.has(day)) last.set(name, series.get(day));
  }
  const rels = [];
  for (const [name, price] of last) {
    const base = bases.get(name);
    if (base > 0 && price > 0) rels.push(price / base);
  }
  if (rels.length < 3) continue;
  points.push({
    date: day,
    price: Math.round(((BASE_LEVEL * rels.reduce((a, b) => a + b, 0)) / rels.length) * 100) / 100,
    orders: salesByDay.get(day) ?? 0,
  });
}

const payload = {
  id: "stockx-contest-yeezy-offwhite",
  name: "StockX Contest Index (Yeezy + Off-White)",
  source: "stockx_contest_2019",
  note: "Growing equal-weight price index from the official StockX Data Contest 2019 sample: U.S. Yeezy + Off-White sales, Sep 2017–Feb 2019. Each colorway is measured vs its first observed median sale. Base level = 1000. Real transaction prices.",
  baseLevel: BASE_LEVEL,
  baseDate: points[0]?.date,
  asOf: points.at(-1)?.date,
  constituents: sneakerSeries.size,
  brands: ["Yeezy", "Off-White"],
  citation: "https://stockx.com/news/the-2019-data-contest/",
  dataUrl:
    "https://s3.amazonaws.com/stockx-sneaker-analysis/wp-content/uploads/2019/02/StockX-Data-Contest-2019-3.xlsx",
  points,
};

const out = path.resolve("src/data/index/stockx-contest-2017-2019.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(payload)}\n`);
console.log(`wrote ${out} (${points.length} points, ${sneakerSeries.size} sneakers)`);

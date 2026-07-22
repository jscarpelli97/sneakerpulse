#!/usr/bin/env node
/**
 * Build the Nov 2020–Dec 2021 SPI segment from Flurin17 daily StockX snapshots.
 *
 * Download: https://drive.google.com/file/d/1vO4Yh2LSk2yDuI15aXwxpwNJ9gXrbSrm
 * (JSON array of daily product market rows — ~329MB)
 *
 * Usage:
 *   node scripts/build-flurin-index.mjs /path/to/flurin.json
 *
 * Output: src/data/index/stockx-flurin-2020-2021.json
 */
import path from "node:path";
import { spawnSync } from "node:child_process";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/build-flurin-index.mjs <flurin.json>");
  process.exit(1);
}

const py = `
import json, sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

try:
  import ijson
except ImportError:
  import subprocess
  subprocess.check_call([sys.executable, "-m", "pip", "install", "ijson", "-q"])
  import ijson

src = Path(sys.argv[1])
TOP_N = 200
BASE = 1000.0
by_day = defaultdict(dict)
pids = set()
n = 0

with src.open("rb") as f:
  for item in ijson.items(f, "item"):
    n += 1
    d = item.get("date")
    if isinstance(d, dict):
      d = d.get("$date")
    if not d:
      continue
    day = str(d)[:10]
    pid = item.get("ID")
    if not pid:
      continue
    ask = item.get("lowestAsk")
    try:
      ask = float(ask) if ask is not None else None
    except Exception:
      continue
    if ask is None or not (ask > 0):
      continue
    try:
      sold = float(item.get("deadstockSold") or 0)
    except Exception:
      sold = 0
    by_day[day][pid] = (ask, max(1.0, sold))
    pids.add(pid)

timeline = sorted(by_day)
points = []
level = BASE
prev = None
for day in timeline:
  cur = by_day[day]
  if prev is None:
    points.append({"date": day, "price": round(level, 2), "orders": len(cur)})
    prev = cur
    continue
  common = [
    (pid, cur[pid][0], cur[pid][1], prev[pid][0])
    for pid in cur
    if pid in prev and prev[pid][0] > 0
  ]
  common.sort(key=lambda x: x[2], reverse=True)
  basket = common[:TOP_N]
  if len(basket) >= 20:
    den = sum(b[2] for b in basket)
    if den > 0:
      level *= sum(w * (pt / p0) for _, pt, w, p0 in basket) / den
  points.append({
    "date": day,
    "price": round(level, 2),
    "orders": len(basket) if basket else len(cur),
  })
  prev = cur

expanded = []
for i, pt in enumerate(points):
  start = datetime.strptime(pt["date"], "%Y-%m-%d")
  end = (
    datetime.strptime(points[i + 1]["date"], "%Y-%m-%d")
    if i + 1 < len(points)
    else start + timedelta(days=1)
  )
  d = start
  while d < end:
    expanded.append({
      "date": d.strftime("%Y-%m-%d"),
      "price": pt["price"],
      "orders": pt["orders"] if d == start else 0,
    })
    d += timedelta(days=1)

payload = {
  "id": "stockx-flurin-daily-2020-2021",
  "name": "SneakerPulse Market Index (2020–2021 segment)",
  "source": "flurin17_stockx_daily_snapshots",
  "note": "Daily chained Laspeyres on top 200 StockX products by cumulative sales (deadstockSold), priced on lowestAsk. Built from Flurin17 daily market snapshots (~4k products, Nov 2020–Dec 2021). Segment base=1000 (rebased when merged).",
  "baseLevel": BASE,
  "baseDate": expanded[0]["date"],
  "asOf": expanded[-1]["date"],
  "constituents": TOP_N,
  "productsCovered": len(pids),
  "citation": "https://github.com/Flurin17/stockXsalesData",
  "resolution": "daily",
  "observedDays": len(points),
  "points": expanded,
}
out = Path("src/data/index/stockx-flurin-2020-2021.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload) + "\\n")
print(f"wrote {out} rows={n} products={len(pids)} days={len(points)} daily={len(expanded)} end={expanded[-1]}")
`;

const result = spawnSync("python3", ["-c", py, input], {
  stdio: "inherit",
  cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."),
});
process.exit(result.status ?? 1);

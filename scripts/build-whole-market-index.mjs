#!/usr/bin/env node
/**
 * Rebuild the whole-market StockX index from embSneakers transaction dump.
 *
 * 1) Download the shared Dropbox folder zip from https://bit.ly/3DvnC6p
 *    (contains resale_transactions_ALL.csv)
 * 2) node scripts/build-whole-market-index.mjs /path/to/emb.zip
 *
 * Output: src/data/index/stockx-whole-market-2012-2020.json
 *
 * Method (ChronoPulse-style):
 * - Monthly chained Laspeyres on the top 200 colorways by transaction count
 * - Basket membership rotates as liquidity shifts (shoes come and go)
 * - Expanded to daily via month-end LOCF for charting
 */
import path from "node:path";
import { spawnSync } from "node:child_process";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/build-whole-market-index.mjs <emb.zip|csv>");
  process.exit(1);
}

// Prefer the Python builder for memory-efficient streaming of the 1.6GB CSV.
const py = `
import csv, io, json, zipfile, sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

src = Path(sys.argv[1])
TOP_N = 200
BASE = 1000.0

sum_price = defaultdict(float)
n_price = defaultdict(int)
months=set(); pids=set()

def consume(reader):
  global rows
  for row in reader:
    rows += 1
    month=row['month_sold'].strip()
    pid=row['image_fileName'].strip()
    try: price=float(row['original_resellPrice'])
    except: continue
    if not month or not pid or not (price>0): continue
    key=(pid, month)
    sum_price[key]+=price; n_price[key]+=1
    months.add(month); pids.add(pid)

rows=0
if src.suffix.lower()=='.zip':
  z=zipfile.ZipFile(src)
  name=next(n for n in z.namelist() if n.endswith('resale_transactions_ALL.csv'))
  with z.open(name) as raw:
    f=io.TextIOWrapper(raw, encoding='utf-8', errors='replace', newline='')
    consume(csv.DictReader(f))
else:
  with src.open(newline='', encoding='utf-8', errors='replace') as f:
    consume(csv.DictReader(f))

avg={k: sum_price[k]/n_price[k] for k in sum_price}
by_month=defaultdict(dict)
for (pid, month), a in avg.items():
  by_month[month][pid]=(a, n_price[(pid,month)])

timeline=sorted(months)
points=[]; level=BASE; prev=None
for month in timeline:
  cur=by_month[month]
  if prev is None:
    points.append({'date': f'{month}-01', 'price': round(level,2), 'orders': sum(c for _,c in cur.values())})
    prev=cur; continue
  common=[(pid, cur[pid][0], cur[pid][1], prev[pid][0]) for pid in cur if pid in prev and prev[pid][0]>0]
  common.sort(key=lambda x: x[2], reverse=True)
  basket=common[:TOP_N]
  if len(basket)>=20:
    num=sum(w*(pt/p0) for _,pt,w,p0 in basket); den=sum(w for *_,w,_ in [(0,0,b[2],0) for b in basket])
    den=sum(b[2] for b in basket)
    if den>0: level *= num/den
  points.append({'date': f'{month}-01', 'price': round(level,2), 'orders': sum(c for _,c in cur.values())})
  prev=cur

expanded=[]
for i,pt in enumerate(points):
  start=datetime.strptime(pt['date'],'%Y-%m-%d')
  end=datetime.strptime(points[i+1]['date'],'%Y-%m-%d') if i+1<len(points) else (
    datetime(start.year+(1 if start.month==12 else 0), 1 if start.month==12 else start.month+1, 1)
  )
  d=start
  while d < end:
    expanded.append({'date': d.strftime('%Y-%m-%d'), 'price': pt['price'], 'orders': pt['orders'] if d==start else 0})
    d += timedelta(days=1)

payload={
  'id': 'stockx-whole-market-embsneakers',
  'name': 'SneakerPulse Market Index',
  'source': 'embsneakers_stockx_transactions',
  'note': 'ChronoPulse-style chained Laspeyres index of the StockX sneaker market. Each month the basket is the top 200 colorways by transaction count that also traded the prior month (shoes rotate in/out). Built from embSneakers whole-catalog StockX resale transactions (2012–2020). Base level = 1000.',
  'baseLevel': BASE,
  'baseDate': expanded[0]['date'],
  'asOf': expanded[-1]['date'],
  'constituents': TOP_N,
  'productsCovered': len(pids),
  'citation': 'https://github.com/embSneakers/embSneakers',
  'paper': 'Park et al., Using Web Data to Reveal 22-Year History of Sneaker Designs, WWW 2022',
  'dataUrl': 'https://bit.ly/3DvnC6p',
  'resolution': 'monthly_locf_daily',
  'monthlyPoints': len(points),
  'points': expanded,
}
out=Path('src/data/index/stockx-whole-market-2012-2020.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload)+'\\n')
print(f'wrote {out} rows={rows} products={len(pids)} months={len(points)} daily={len(expanded)} end={expanded[-1]}')
`;

const result = spawnSync("python3", ["-c", py, input], {
  stdio: "inherit",
  cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."),
});
process.exit(result.status ?? 1);

#!/usr/bin/env node
/**
 * Rebuild src/data/wardrobe/personal-collection.json from the inventory PDF.
 *
 * Usage:
 *   node scripts/import-personal-collection-pdf.mjs [path-to.pdf]
 *
 * Requires: python3 + pypdf  (`python3 -m pip install pypdf`)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pdfPath =
  process.argv[2] ||
  path.join(
    process.env.HOME || "",
    ".cursor/projects/agent/uploads/Resale_20Inventory_20__20Budget_20Tracker.pdf_4579.pdf",
  );

const outPath = path.join(
  __dirname,
  "..",
  "src/data/wardrobe/personal-collection.json",
);

if (!fs.existsSync(pdfPath)) {
  console.error("PDF not found:", pdfPath);
  process.exit(1);
}

const py = `
from pypdf import PdfReader
import re, json
text=(PdfReader(${JSON.stringify(pdfPath)}).pages[0].extract_text() or "")
header="Item NameCategorySizeColorConditionPurchase DateWhere BoughtItem PriceSales TaxProcessing FeeShippingTotal CostListedSoldSale DateWhere SoldItem PriceTransaction FeePayment Processing FeeShipping FeeNet ProceedsBank PayoutsProfit/LossDays HeldStatusStrategyMax Hold TimeNotes"
body=text[len(header):]
names=sorted([
"Supreme Box Logo Hooded Sweatshirt (FW25)","Supreme Drawstring Bag Free Gift (FW25)",
"Supreme Box Logo Tee (FW23)","Supreme Tyler The Creator Tee","Supreme Mophie Qi2 Powerstation",
"Supreme NYC Tee","Jordan 1 Retro Low OG","Jordan 11 Retro Low (2026)","Stüssy 8-Ball Rug",
"Palace Polartec Lazer Earwarmer","Palace Polartec 200 Jogger","Palace Patchy Flannel Shirt",
"Palace Basically A Beach Towel","Palace Gargoyle Longsleeve","YoungLA Batman Compression Tees",
"Gymshark Onyx 5.0 Seamless Hoodie","Gymshark Onyx 5.0 Seamless T-shirt","Eric Emanuel Basic Short",
], key=len, reverse=True)
pat='|'.join(re.escape(n) for n in names)
matches=list(re.finditer(pat, body))
chunks=[]
for i,m in enumerate(matches):
  end=matches[i+1].start() if i+1 < len(matches) else len(body)
  name=m.group(0); rest=body[m.end():end]
  if not re.match(r"(Tops|Sneakers|Accessories|Hats|Pants|Shorts)", rest): continue
  chunks.append((name, rest))
cats=r"Tops \\(Short Sleeve\\)|Tops \\(Long Sleeve\\)|Sneakers|Accessories|Hats|Pants|Shorts"
sizes=r"L/XL|XXL|XL|OS|12|34|L|M|S"; cond=r"Used|New"
stores=r"Hibbett Sports|Snipes USA|Finish Line|Eric Emanuel|YoungLA|Gymshark|Supreme|StockX|Stüssy|Palace"
rows=[]
for name, rest in chunks:
  m=re.match(rf"^(?P<category>{cats})(?P<size>{sizes})(?P<color>.+?)(?P<condition>{cond})(?P<date>\\d{{1,2}}/\\d{{1,2}}/\\d{{4}})(?P<where>{stores})(?P<itemPrice>\\$[\\d,.]+)(?P<tax>\\$[\\d,.]+)(?P<proc>\\$[\\d,.]+)(?P<ship>\\$[\\d,.]+)(?P<total>\\$[\\d,.]+)(?P<tail>.*)$", rest)
  if not m: raise SystemExit('parse fail: '+name)
  d=m.groupdict(); tail=d.pop('tail')
  days_m=re.search(r"(\\d+)\\s*Personal", tail)
  notes_m=re.search(r"Personal(.*)$", tail)
  notes=(notes_m.group(1).strip() if notes_m else "") or None
  if notes and notes.startswith("Bought 2"):
    notes="Bought 2 Stüssy 8-Ball Rugs at $65 each for resale. Strong StockX demand ~$130–140, margins ~$30/unit. Keep in original box; first rug already personal."
  rows.append({"name":name,"category":d["category"],"size":d["size"],"color":d["color"].strip(),"condition":d["condition"],"purchaseDate":d["date"],"whereBought":d["where"],"itemPrice":d["itemPrice"],"totalCost":d["total"],"daysHeld":days_m.group(1) if days_m else None,"notes":notes})
print(json.dumps(rows, ensure_ascii=False))
`;

const rows = JSON.parse(
  execFileSync("python3", ["-c", py], { encoding: "utf8" }),
);

function sx(filename, updated) {
  let u = `https://images.stockx.com/images/${filename}?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color`;
  if (updated) u += `&updated_at=${updated}`;
  return u;
}

const META = [
  ["pc-supreme-nyc-tee", null, sx("Supreme-NYC-Tee-Black.jpg"), "Supreme", null],
  ["pc-supreme-bogo-tee-fw23", "supreme-box-logo-tee-fw23-black", sx("Supreme-Box-Logo-Tee-FW23-Black.jpg"), "Supreme", null],
  ["pc-j1-mocha-finishline", "air-jordan-1-retro-low-og-mocha", sx("Air-Jordan-1-Retro-Low-OG-Mocha-Product.jpg", "1738193358"), "Jordan", "CZ0790-102"],
  ["pc-j1-chicago-hibbett", "air-jordan-1-retro-low-og-chicago", sx("Air-Jordan-1-Retro-Low-OG-Chicago-2025-Product.jpg"), "Jordan", null],
  ["pc-j1-chicago-snipes", "air-jordan-1-retro-low-og-chicago", sx("Air-Jordan-1-Retro-Low-OG-Chicago-2025-Product.jpg"), "Jordan", null],
  ["pc-supreme-bogo-hoodie-fw25", "supreme-box-logo-hooded-sweatshirt-fw25-black", sx("Supreme-Box-Logo-Hooded-Sweatshirt-Black.jpg"), "Supreme", null],
  ["pc-supreme-mophie-qi2", null, "/wardrobe/collection/supreme-mophie-qi2.jpg", "Supreme", null],
  ["pc-j1-mocha-stockx", "air-jordan-1-retro-low-og-mocha", sx("Air-Jordan-1-Retro-Low-OG-Mocha-Product.jpg", "1738193358"), "Jordan", "CZ0790-102"],
  ["pc-supreme-tyler-tee", "supreme-tyler-the-creator-tee-black", sx("Supreme-Tyler-The-Creator-Tee-Black.jpg"), "Supreme", null],
  ["pc-stussy-8ball-rug", null, "/wardrobe/collection/stussy-8ball-rug.jpg", "Stüssy", null],
  ["pc-palace-earwarmer", null, sx("Palace-Polartec-Lazer-Earwarmer-Black.jpg"), "Palace", null],
  ["pc-palace-jogger", null, sx("Palace-Polartec-200-Jogger-Black.jpg"), "Palace", null],
  ["pc-palace-flannel", null, sx("Palace-Patchy-Flannel-Shirt-Red.jpg"), "Palace", null],
  ["pc-youngla-batman", null, "/wardrobe/collection/youngla-batman-tee.jpg", "YoungLA", null],
  ["pc-gymshark-onyx-hoodie", null, "/wardrobe/collection/gymshark-onyx-hoodie.webp", "Gymshark", null],
  ["pc-gymshark-onyx-tee", null, "/wardrobe/collection/gymshark-onyx-tee.jpg", "Gymshark", null],
  ["pc-supreme-drawstring-fw25", null, "/wardrobe/collection/supreme-drawstring-realtree.jpg", "Supreme", null],
  ["pc-palace-beach-towel", null, sx("Palace-Basically-A-Beach-Towel-White.jpg"), "Palace", null],
  ["pc-palace-gargoyle", "palace-gargoyle-l-s-t-shirt-black", sx("Palace-Gargoyle-L-S-T-shirt-Black.jpg", "1778519611"), "Palace", null],
  ["pc-ee-blue-yonder", "eric-emanuel-ee-basic-short-blue-yonder-white", sx("Eric-Emanuel-EE-Basic-Short-Blue-Yonder-White.jpg", "1659547786"), "Eric Emanuel", null],
  ["pc-j11-uni-blue", "air-jordan-11-retro-low-university-blue-2026", sx("Air-Jordan-11-Retro-Low-University-Blue-2026-Product.jpg", "1784332827"), "Jordan", "FV5104-100"],
];

if (rows.length !== META.length) {
  console.error(`Row count ${rows.length} != meta ${META.length}`);
  process.exit(1);
}

function wardrobeKind(name, category) {
  if (category === "Sneakers") return "sneaker";
  if (category === "Accessories" || category === "Hats") return "accessory";
  if (category === "Pants" || category === "Shorts") return "bottom";
  if (name.includes("Hoodie") || name.includes("Hooded")) return "outerwear";
  if (category.startsWith("Tops")) return "top";
  return "other";
}

const COLOR_OVERRIDE = { "pc-ee-blue-yonder": "Blue Yonder/White" };
const PLACEHOLDER_PHOTO = new Set([
  "pc-youngla-batman",
  "pc-gymshark-onyx-tee",
  "pc-supreme-drawstring-fw25",
]);

const items = rows.map((row, i) => {
  const [pid, slug, image, brand, style] = META[i];
  const key = `[pc:${pid.replace(/^pc-/, "")}]`;
  let displayName = row.name;
  if (pid.startsWith("pc-j1-mocha")) displayName = "Jordan 1 Retro Low OG Mocha";
  else if (pid.startsWith("pc-j1-chicago")) displayName = "Jordan 1 Retro Low OG Chicago";
  else if (pid === "pc-j11-uni-blue") displayName = "Jordan 11 Retro Low University Blue (2026)";
  else if (pid === "pc-youngla-batman") displayName = "YoungLA Batman Compression Tee";

  const noteBits = [
    row.condition,
    row.whereBought,
    `${row.totalCost} total`,
    row.purchaseDate,
  ];
  if (row.notes) noteBits.push(row.notes);
  if (PLACEHOLDER_PHOTO.has(pid)) noteBits.push("swap in a photo when you can");
  noteBits.push(key);

  /** @type {Record<string, unknown>} */
  const item = {
    id: pid,
    kind: wardrobeKind(row.name, row.category),
    name: displayName,
    brand,
    colorway: COLOR_OVERRIDE[pid] || row.color,
    size: row.size,
    image,
    notes: noteBits.join(" · "),
    source: "personal-pdf",
  };
  if (slug) item.slug = slug;
  if (style) item.styleCode = style;
  return item;
});

const out = {
  note: "John's personal collection parsed from Resale Inventory & Budget Tracker PDF. Import into Closet — skips pieces already owned. Chicago/Mocha doubles kept as separate pairs.",
  updatedAt: new Date().toISOString().slice(0, 10),
  sourcePdf: path.basename(pdfPath),
  items,
};

fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${items.length} items → ${outPath}`);

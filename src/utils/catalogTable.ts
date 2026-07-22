import type { CatalogQuote } from "@/services/market/getCatalogQuotes";

export type CatalogRow = CatalogQuote;

export type CatalogSortKey =
  | "rank"
  | "name"
  | "ticker"
  | "price"
  | "weeklyOrders"
  | "status";

export type CatalogSortDir = "asc" | "desc";

export function filterCatalogRows(
  rows: CatalogRow[],
  query: string,
): CatalogRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.brand,
      row.ticker,
      row.styleCode,
      row.colorway,
      row.slug,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function cmpNullableNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: CatalogSortDir,
) {
  const av = a == null || Number.isNaN(a) ? null : a;
  const bv = b == null || Number.isNaN(b) ? null : b;
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return dir === "asc" ? av - bv : bv - av;
}

function cmpString(a: string, b: string, dir: CatalogSortDir) {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? result : -result;
}

export function sortCatalogRows(
  rows: CatalogRow[],
  key: CatalogSortKey,
  dir: CatalogSortDir,
): CatalogRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (key) {
      case "name":
        return cmpString(a.name, b.name, dir);
      case "ticker":
        return cmpString(a.ticker, b.ticker, dir);
      case "price":
        return cmpNullableNumber(a.price, b.price, dir);
      case "weeklyOrders":
        return cmpNullableNumber(a.weeklyOrders, b.weeklyOrders, dir);
      case "status": {
        const as = a.live ? 1 : 0;
        const bs = b.live ? 1 : 0;
        return dir === "asc" ? as - bs : bs - as;
      }
      case "rank":
      default:
        return cmpNullableNumber(a.rank, b.rank, dir);
    }
  });
  return sorted;
}

import { traitValue } from "@/services/catalog/mapProductToCatalog";
import type { KicksProduct } from "@/types/kicksdb";
import type { ChartPoint } from "@/types/market";

/** 100 = volume-weighted basket exactly at retail. */
export const PREMIUM_INDEX_BASE = 100;

export function parseRetailPrice(product: KicksProduct): number | null {
  const raw = traitValue(product.traits, "Retail Price");
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function askRetailRatio(
  ask: number | null | undefined,
  retail: number | null | undefined,
): number | null {
  if (
    ask == null ||
    retail == null ||
    !(ask > 0) ||
    !(retail > 0) ||
    !Number.isFinite(ask) ||
    !Number.isFinite(retail)
  ) {
    return null;
  }
  return ask / retail;
}

/**
 * Volume-weighted ask/retail × 100.
 * 100 = at retail, 200 = 2× retail, 80 = 20% below retail.
 */
export function buildPremiumIndexLevel(
  rows: Array<{
    ask: number | null | undefined;
    retail: number | null | undefined;
    weight?: number | null;
  }>,
): {
  level: number | null;
  premiumPercent: number | null;
  constituents: number;
  atOrBelowRetail: number;
} {
  let num = 0;
  let den = 0;
  let constituents = 0;
  let atOrBelowRetail = 0;

  for (const row of rows) {
    const ratio = askRetailRatio(row.ask, row.retail);
    if (ratio == null) continue;
    const weight = Math.max(1, row.weight ?? 1);
    num += weight * ratio;
    den += weight;
    constituents += 1;
    if (ratio <= 1) atOrBelowRetail += 1;
  }

  if (!(den > 0) || constituents < 3) {
    return {
      level: null,
      premiumPercent: null,
      constituents,
      atOrBelowRetail,
    };
  }

  const level = Math.round(((PREMIUM_INDEX_BASE * num) / den) * 100) / 100;
  return {
    level,
    premiumPercent: Math.round((level - PREMIUM_INDEX_BASE) * 100) / 100,
    constituents,
    atOrBelowRetail,
  };
}

export function premiumPoint(
  date: string,
  level: number,
  orders = 1,
): ChartPoint {
  return { date: date.slice(0, 10), price: level, orders };
}

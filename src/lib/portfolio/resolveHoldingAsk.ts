import type { SizeAsk } from "@/types/market";

export type HoldingAskSource = "size" | "fallback" | "none";

export type HoldingAskResolution = {
  ask: number | null;
  source: HoldingAskSource;
};

/** Normalize US size labels so "10", "10.0", " 10 " match. */
export function normalizeSizeLabel(size: string): string {
  const trimmed = size.trim().toLowerCase();
  if (!trimmed || trimmed === "—" || trimmed === "-") return "";
  return trimmed.replace(/\.0+$/, "");
}

export function findSizeAsk(
  sizes: SizeAsk[] | null | undefined,
  holdingSize: string,
): SizeAsk | null {
  const target = normalizeSizeLabel(holdingSize);
  if (!target || !sizes?.length) return null;
  return (
    sizes.find((row) => normalizeSizeLabel(row.size) === target) ?? null
  );
}

/**
 * Resolve mark-to-market ask for a portfolio holding.
 * Prefers that size's StockX lowest ask — never prefers product "all" ask.
 */
export function resolveHoldingAsk(input: {
  holdingSize: string;
  sizes?: SizeAsk[] | null;
  /** Last-resort product-level ask when the size ladder has no quote. */
  catalogPrice?: number | null;
  marketPrice?: number | null;
  statsLowestAsk?: number | null;
}): HoldingAskResolution {
  const sizeRow = findSizeAsk(input.sizes, input.holdingSize);
  if (sizeRow?.lowestAsk != null && sizeRow.lowestAsk > 0) {
    return { ask: sizeRow.lowestAsk, source: "size" };
  }

  const fallbackCandidates = [
    input.catalogPrice,
    input.statsLowestAsk,
    input.marketPrice,
  ];
  for (const value of fallbackCandidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return { ask: value, source: "fallback" };
    }
  }
  return { ask: null, source: "none" };
}

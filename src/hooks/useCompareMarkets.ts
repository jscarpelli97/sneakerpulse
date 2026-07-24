"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMarket } from "@/api/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export const MAX_COMPARE = 5;
export const MIN_COMPARE = 2;

export type CompareQuote = {
  slug: string;
  name: string;
  ticker: string;
  brand: string;
  colorway: string;
  year: number;
  styleCode: string;
  retail: number | null;
  price: number | null;
  lastSale: number | null;
  weeklyOrders: number | null;
  sales30d: number | null;
  rank: number | null;
  change30d: number | null;
  high30d: number | null;
  low30d: number | null;
  image: string;
  stockxUrl: string;
};

export type CompareCell = {
  slug: string;
  display: string;
  raw: number | null;
};

export type CompareMetricRow = {
  label: string;
  hint?: string;
  cells: CompareCell[];
  /** Slug(s) that win this metric (ties allowed). */
  winnerSlugs: string[];
  kind: "money" | "percent" | "number" | "rank" | "text";
};

function premiumPct(price: number | null, retail: number | null) {
  if (price == null || retail == null || retail <= 0) return null;
  return (price / retail) * 100 - 100;
}

function pickWinnerSlugs(
  cells: { slug: string; raw: number | null }[],
  prefer: "lower" | "higher" | null,
): string[] {
  if (!prefer) return [];
  const ranked = cells.filter((c) => c.raw != null);
  if (ranked.length === 0) return [];
  const best =
    prefer === "lower"
      ? Math.min(...ranked.map((c) => c.raw as number))
      : Math.max(...ranked.map((c) => c.raw as number));
  return ranked.filter((c) => c.raw === best).map((c) => c.slug);
}

function toQuote(
  slug: string,
  res: Awaited<ReturnType<typeof fetchMarket>>,
): CompareQuote | null {
  if (!res.ok) return null;
  const d = res.data;
  return {
    slug: d.slug || slug,
    name: d.name,
    ticker: d.ticker,
    brand: d.brand,
    colorway: d.colorway,
    year: d.year,
    styleCode: d.styleCode,
    retail: d.retail ?? null,
    price: d.price,
    lastSale: d.stats.lastSale,
    weeklyOrders: d.stats.weeklyOrders,
    sales30d: d.stats.sales30d,
    rank: d.stats.rank,
    change30d: d.change30d?.percent ?? null,
    high30d: d.stats.high30d,
    low30d: d.stats.low30d,
    image: d.image,
    stockxUrl: d.stockxUrl,
  };
}

export function useCompareMarkets(initialSlugs: string[]) {
  const [slugs, setSlugs] = useState(() =>
    uniqueSlugs(initialSlugs).slice(0, MAX_COMPARE),
  );
  const [quotes, setQuotes] = useState<Record<string, CompareQuote | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const compare = useCallback(async () => {
    if (slugs.length < MIN_COMPARE) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        slugs.map(async (slug) => [slug, await fetchMarket(slug)] as const),
      );
      if (id !== requestId.current) return;
      const next: Record<string, CompareQuote | null> = {};
      for (const [slug, res] of results) {
        next[slug] = toQuote(slug, res);
      }
      setQuotes(next);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [slugs]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void compare();
    }, 180);
    return () => window.clearTimeout(t);
  }, [compare]);

  const orderedQuotes = useMemo(
    () => slugs.map((slug) => quotes[slug] ?? null),
    [slugs, quotes],
  );

  const rows = useMemo((): CompareMetricRow[] => {
    if (slugs.length < MIN_COMPARE) return [];
    if (!orderedQuotes.some(Boolean)) return [];

    const fmtPct = (v: number | null) =>
      v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

    const build = (
      label: string,
      prefer: "lower" | "higher" | null,
      kind: CompareMetricRow["kind"],
      cell: (q: CompareQuote | null) => CompareCell,
      hint?: string,
    ): CompareMetricRow => {
      const cells = slugs.map((slug, i) => {
        const built = cell(orderedQuotes[i] ?? null);
        return { ...built, slug };
      });
      return {
        label,
        hint,
        cells,
        winnerSlugs: pickWinnerSlugs(cells, prefer),
        kind,
      };
    };

    return [
      build(
        "Lowest ask",
        "lower",
        "money",
        (q) => ({
          slug: "",
          display: formatMaybeMoney(q?.price),
          raw: q?.price ?? null,
        }),
        "Cheaper ask wins",
      ),
      build("Retail", null, "money", (q) => ({
        slug: "",
        display: formatMaybeMoney(q?.retail),
        raw: q?.retail ?? null,
      })),
      build(
        "Premium vs retail",
        "lower",
        "percent",
        (q) => {
          const prem = premiumPct(q?.price ?? null, q?.retail ?? null);
          return { slug: "", display: fmtPct(prem), raw: prem };
        },
        "Lower premium = closer to retail",
      ),
      build("30d change", "higher", "percent", (q) => ({
        slug: "",
        display:
          q?.change30d != null
            ? `${q.change30d > 0 ? "+" : ""}${q.change30d.toFixed(2)}%`
            : "—",
        raw: q?.change30d ?? null,
      })),
      build("Last sale", "lower", "money", (q) => ({
        slug: "",
        display: formatMaybeMoney(q?.lastSale),
        raw: q?.lastSale ?? null,
      })),
      build("30d high / low", null, "text", (q) => ({
        slug: "",
        display:
          q?.high30d != null || q?.low30d != null
            ? `${formatMaybeMoney(q?.high30d)} / ${formatMaybeMoney(q?.low30d)}`
            : "—",
        raw: q?.high30d ?? null,
      })),
      build(
        "Weekly orders",
        "higher",
        "number",
        (q) => ({
          slug: "",
          display: q?.weeklyOrders != null ? formatNumber(q.weeklyOrders) : "—",
          raw: q?.weeklyOrders ?? null,
        }),
        "Higher volume wins",
      ),
      build("30d sales", "higher", "number", (q) => ({
        slug: "",
        display: q?.sales30d != null ? formatNumber(q.sales30d) : "—",
        raw: q?.sales30d ?? null,
      })),
      build(
        "StockX rank",
        "lower",
        "rank",
        (q) => ({
          slug: "",
          display: q?.rank != null ? `#${q.rank}` : "—",
          raw: q?.rank ?? null,
        }),
        "Lower rank is hotter",
      ),
    ];
  }, [slugs, orderedQuotes]);

  const winCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slug of slugs) counts[slug] = 0;
    for (const row of rows) {
      for (const winner of row.winnerSlugs) {
        counts[winner] = (counts[winner] ?? 0) + 1;
      }
    }
    return counts;
  }, [rows, slugs]);

  const addSlug = useCallback((slug: string) => {
    setSlugs((prev) => {
      if (prev.includes(slug) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeSlug = useCallback((slug: string) => {
    setSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  const replaceSlugs = useCallback((next: string[]) => {
    setSlugs(uniqueSlugs(next).slice(0, MAX_COMPARE));
  }, []);

  return {
    slugs,
    setSlugs: replaceSlugs,
    addSlug,
    removeSlug,
    quotes,
    orderedQuotes,
    rows,
    winCounts,
    loading,
    error,
    compare,
    canAdd: slugs.length < MAX_COMPARE,
    ready: slugs.length >= MIN_COMPARE,
  };
}

function uniqueSlugs(slugs: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of slugs) {
    const trimmed = slug.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

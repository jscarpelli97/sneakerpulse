"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMarket } from "@/api/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

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

export type CompareSide = "left" | "right" | "tie" | null;

export type CompareRow = {
  label: string;
  hint?: string;
  left: string;
  right: string;
  leftRaw: number | null;
  rightRaw: number | null;
  /** Which side "wins" for this metric (buyer-friendly when lower/higher matters). */
  winner: CompareSide;
  kind: "money" | "percent" | "number" | "rank" | "text";
};

function premiumPct(price: number | null, retail: number | null) {
  if (price == null || retail == null || retail <= 0) return null;
  return ((price / retail) * 100) - 100;
}

function pickWinner(
  left: number | null,
  right: number | null,
  prefer: "lower" | "higher",
): CompareSide {
  if (left == null && right == null) return null;
  if (left == null) return "right";
  if (right == null) return "left";
  if (left === right) return "tie";
  if (prefer === "lower") return left < right ? "left" : "right";
  return left > right ? "left" : "right";
}

export function useCompareMarkets(initialA: string, initialB: string) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [quotes, setQuotes] = useState<Record<string, CompareQuote | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const compare = useCallback(async () => {
    if (!a || !b || a === b) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const [ra, rb] = await Promise.all([fetchMarket(a), fetchMarket(b)]);
      if (id !== requestId.current) return;
      const next: Record<string, CompareQuote | null> = {};
      for (const [slug, res] of [
        [a, ra],
        [b, rb],
      ] as const) {
        if (!res.ok) {
          next[slug] = null;
          continue;
        }
        const d = res.data;
        next[slug] = {
          slug: d.slug,
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
      setQuotes(next);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [a, b]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void compare();
    }, 180);
    return () => window.clearTimeout(t);
  }, [compare]);

  const left = quotes[a] ?? null;
  const right = quotes[b] ?? null;

  const rows = useMemo((): CompareRow[] => {
    if (!left && !right) return [];

    const leftPrem = premiumPct(left?.price ?? null, left?.retail ?? null);
    const rightPrem = premiumPct(right?.price ?? null, right?.retail ?? null);

    const fmtPct = (v: number | null) =>
      v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

    return [
      {
        label: "Lowest ask",
        hint: "Cheaper ask wins",
        left: formatMaybeMoney(left?.price),
        right: formatMaybeMoney(right?.price),
        leftRaw: left?.price ?? null,
        rightRaw: right?.price ?? null,
        winner: pickWinner(left?.price ?? null, right?.price ?? null, "lower"),
        kind: "money",
      },
      {
        label: "Retail",
        left: formatMaybeMoney(left?.retail),
        right: formatMaybeMoney(right?.retail),
        leftRaw: left?.retail ?? null,
        rightRaw: right?.retail ?? null,
        winner: null,
        kind: "money",
      },
      {
        label: "Premium vs retail",
        hint: "Lower premium = closer to retail",
        left: fmtPct(leftPrem),
        right: fmtPct(rightPrem),
        leftRaw: leftPrem,
        rightRaw: rightPrem,
        winner: pickWinner(leftPrem, rightPrem, "lower"),
        kind: "percent",
      },
      {
        label: "30d change",
        left:
          left?.change30d != null
            ? `${left.change30d > 0 ? "+" : ""}${left.change30d.toFixed(2)}%`
            : "—",
        right:
          right?.change30d != null
            ? `${right.change30d > 0 ? "+" : ""}${right.change30d.toFixed(2)}%`
            : "—",
        leftRaw: left?.change30d ?? null,
        rightRaw: right?.change30d ?? null,
        winner: pickWinner(
          left?.change30d ?? null,
          right?.change30d ?? null,
          "higher",
        ),
        kind: "percent",
      },
      {
        label: "Last sale",
        left: formatMaybeMoney(left?.lastSale),
        right: formatMaybeMoney(right?.lastSale),
        leftRaw: left?.lastSale ?? null,
        rightRaw: right?.lastSale ?? null,
        winner: pickWinner(
          left?.lastSale ?? null,
          right?.lastSale ?? null,
          "lower",
        ),
        kind: "money",
      },
      {
        label: "30d high / low",
        left:
          left?.high30d != null || left?.low30d != null
            ? `${formatMaybeMoney(left?.high30d)} / ${formatMaybeMoney(left?.low30d)}`
            : "—",
        right:
          right?.high30d != null || right?.low30d != null
            ? `${formatMaybeMoney(right?.high30d)} / ${formatMaybeMoney(right?.low30d)}`
            : "—",
        leftRaw: left?.high30d ?? null,
        rightRaw: right?.high30d ?? null,
        winner: null,
        kind: "text",
      },
      {
        label: "Weekly orders",
        hint: "Higher volume wins",
        left:
          left?.weeklyOrders != null ? formatNumber(left.weeklyOrders) : "—",
        right:
          right?.weeklyOrders != null ? formatNumber(right.weeklyOrders) : "—",
        leftRaw: left?.weeklyOrders ?? null,
        rightRaw: right?.weeklyOrders ?? null,
        winner: pickWinner(
          left?.weeklyOrders ?? null,
          right?.weeklyOrders ?? null,
          "higher",
        ),
        kind: "number",
      },
      {
        label: "30d sales",
        left: left?.sales30d != null ? formatNumber(left.sales30d) : "—",
        right: right?.sales30d != null ? formatNumber(right.sales30d) : "—",
        leftRaw: left?.sales30d ?? null,
        rightRaw: right?.sales30d ?? null,
        winner: pickWinner(
          left?.sales30d ?? null,
          right?.sales30d ?? null,
          "higher",
        ),
        kind: "number",
      },
      {
        label: "StockX rank",
        hint: "Lower rank is hotter",
        left: left?.rank != null ? `#${left.rank}` : "—",
        right: right?.rank != null ? `#${right.rank}` : "—",
        leftRaw: left?.rank ?? null,
        rightRaw: right?.rank ?? null,
        winner: pickWinner(left?.rank ?? null, right?.rank ?? null, "lower"),
        kind: "rank",
      },
    ];
  }, [left, right]);

  const score = useMemo(() => {
    let leftWins = 0;
    let rightWins = 0;
    for (const row of rows) {
      if (row.winner === "left") leftWins += 1;
      if (row.winner === "right") rightWins += 1;
    }
    return { leftWins, rightWins };
  }, [rows]);

  return {
    a,
    b,
    setA,
    setB,
    quotes,
    left,
    right,
    rows,
    score,
    loading,
    error,
    compare,
  };
}

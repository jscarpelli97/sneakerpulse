"use client";

import { useCallback, useMemo, useState } from "react";
import { fetchMarket } from "@/api/market";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

export type CompareQuote = {
  slug: string;
  name: string;
  ticker: string;
  price: number | null;
  weeklyOrders: number | null;
  rank: number | null;
  change30d: number | null;
  image: string;
};

export function useCompareMarkets(initialA: string, initialB: string) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [quotes, setQuotes] = useState<Record<string, CompareQuote | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ra, rb] = await Promise.all([fetchMarket(a), fetchMarket(b)]);
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
          price: d.price,
          weeklyOrders: d.stats.weeklyOrders,
          rank: d.stats.rank,
          change30d: d.change30d?.percent ?? null,
          image: d.image,
        };
      }
      setQuotes(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }, [a, b]);

  const rows = useMemo(() => {
    const left = quotes[a];
    const right = quotes[b];
    if (!left && !right) return [];
    return [
      {
        label: "Lowest ask",
        left: formatMaybeMoney(left?.price),
        right: formatMaybeMoney(right?.price),
      },
      {
        label: "30d change",
        left:
          left?.change30d != null ? `${left.change30d.toFixed(2)}%` : "—",
        right:
          right?.change30d != null ? `${right.change30d.toFixed(2)}%` : "—",
      },
      {
        label: "Weekly orders",
        left:
          left?.weeklyOrders != null ? formatNumber(left.weeklyOrders) : "—",
        right:
          right?.weeklyOrders != null ? formatNumber(right.weeklyOrders) : "—",
      },
      {
        label: "StockX rank",
        left: left?.rank != null ? `#${left.rank}` : "—",
        right: right?.rank != null ? `#${right.rank}` : "—",
      },
    ];
  }, [a, b, quotes]);

  return {
    a,
    b,
    setA,
    setB,
    quotes,
    rows,
    loading,
    error,
    compare,
  };
}

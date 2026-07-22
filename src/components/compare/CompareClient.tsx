"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SNEAKERS } from "@/catalog/sneakers";
import { formatMaybeMoney, formatNumber } from "@/lib/format";

type Quote = {
  slug: string;
  name: string;
  ticker: string;
  price: number | null;
  weeklyOrders: number | null;
  rank: number | null;
  change30d: number | null;
  image: string;
};

export function CompareClient({
  initialA,
  initialB,
}: {
  initialA: string;
  initialB: string;
}) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ra, rb] = await Promise.all([
        fetch(`/api/market/${a}`).then((r) => r.json()),
        fetch(`/api/market/${b}`).then((r) => r.json()),
      ]);
      const next: Record<string, Quote | null> = {};
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
  }

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm text-ink-soft">
          Sneaker A
          <select
            className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 text-ink"
            value={a}
            onChange={(e) => setA(e.target.value)}
          >
            {SNEAKERS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.ticker} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink-soft">
          Sneaker B
          <select
            className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 text-ink"
            value={b}
            onChange={(e) => setB(e.target.value)}
          >
            {SNEAKERS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.ticker} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading || a === b}
          className="self-end bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "Loading…" : "Compare"}
        </button>
      </div>

      {error ? <p className="text-sm text-down">{error}</p> : null}

      {rows.length > 0 ? (
        <section className="border border-ink/10 bg-white">
          <div className="grid grid-cols-3 border-b border-ink/10 text-sm font-semibold">
            <div className="px-4 py-3 text-ink/45">Metric</div>
            <div className="px-4 py-3">
              <Link href={`/sneakers/${a}`} className="hover:underline">
                {quotes[a]?.ticker ?? a}
              </Link>
            </div>
            <div className="px-4 py-3">
              <Link href={`/sneakers/${b}`} className="hover:underline">
                {quotes[b]?.ticker ?? b}
              </Link>
            </div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 border-b border-ink/10 text-sm last:border-b-0"
            >
              <div className="px-4 py-3 text-ink/50">{row.label}</div>
              <div className="px-4 py-3 font-semibold text-ink">{row.left}</div>
              <div className="px-4 py-3 font-semibold text-ink">{row.right}</div>
            </div>
          ))}
        </section>
      ) : (
        <p className="text-sm text-ink-soft">
          Pick two sneakers and run compare to load live StockX quotes.
        </p>
      )}
    </div>
  );
}

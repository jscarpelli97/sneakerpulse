"use client";

import Link from "next/link";
import { useCompareMarkets } from "@/hooks/useCompareMarkets";
import { SNEAKERS } from "@/services/catalog/sneakers";

export function CompareClient({
  initialA,
  initialB,
}: {
  initialA: string;
  initialB: string;
}) {
  const {
    a,
    b,
    setA,
    setB,
    quotes,
    rows,
    loading,
    error,
    compare,
  } = useCompareMarkets(initialA, initialB);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm text-ink-soft">
          Sneaker A
          <select
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20 focus:border-ink/30"
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
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-ink outline-none hover:border-ink/20 focus:border-ink/30"
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
          onClick={compare}
          disabled={loading || a === b}
          className="self-end rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Loading…" : "Compare"}
        </button>
      </div>

      {error ? <p className="text-sm text-down">{error}</p> : null}

      {rows.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-ink/8">
          <div className="grid grid-cols-3 border-b border-ink/8 bg-paper/60 text-sm font-semibold">
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
              className="grid grid-cols-3 border-b border-ink/8 text-sm last:border-b-0 hover:bg-paper/40"
            >
              <div className="px-4 py-3 text-ink/50">{row.label}</div>
              <div className="px-4 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-ink">
                {row.left}
              </div>
              <div className="px-4 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-ink">
                {row.right}
              </div>
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

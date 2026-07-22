"use client";

import Link from "next/link";
import { useCompareMarkets } from "@/hooks/useCompareMarkets";
import type { SneakerCatalogEntry } from "@/types/catalog";

export function CompareClient({
  sneakers,
  initialA,
  initialB,
}: {
  sneakers: SneakerCatalogEntry[];
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
        <label className="text-sm text-dash-muted">
          Sneaker A
          <select
            className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted focus:border-dash-muted"
            value={a}
            onChange={(e) => setA(e.target.value)}
          >
            {sneakers.map((s) => (
              <option key={s.slug} value={s.slug}>
                #{s.rank ?? "—"} · {s.ticker} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-dash-muted">
          Sneaker B
          <select
            className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-dash-text outline-none hover:border-dash-muted focus:border-dash-muted"
            value={b}
            onChange={(e) => setB(e.target.value)}
          >
            {sneakers.map((s) => (
              <option key={s.slug} value={s.slug}>
                #{s.rank ?? "—"} · {s.ticker} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={compare}
          disabled={loading || a === b}
          className="self-end rounded-xl bg-dash-accent px-5 py-2.5 text-sm font-semibold text-dash-bg shadow-[var(--shadow-sm)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Loading…" : "Compare"}
        </button>
      </div>

      {error ? <p className="text-sm text-dash-down">{error}</p> : null}

      {rows.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-dash-border">
          <div className="grid grid-cols-3 border-b border-dash-border bg-dash-elevated/60 text-sm font-semibold">
            <div className="px-4 py-3 text-dash-faint">Metric</div>
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
              className="grid grid-cols-3 border-b border-dash-border text-sm last:border-b-0 hover:bg-dash-elevated/40"
            >
              <div className="px-4 py-3 text-dash-muted">{row.label}</div>
              <div className="px-4 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text">
                {row.left}
              </div>
              <div className="px-4 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text">
                {row.right}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <p className="text-sm text-dash-muted">
          Pick two sneakers and run compare to load live StockX quotes.
        </p>
      )}
    </div>
  );
}

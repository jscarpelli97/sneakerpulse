"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompareMarkets } from "@/hooks/useCompareMarkets";
import type { SneakerCatalogEntry } from "@/types/catalog";
import { changeClass, formatMaybeMoney } from "@/utils/format";

function catalogPick(sneakers: SneakerCatalogEntry[], slug: string) {
  return sneakers.find((s) => s.slug === slug) ?? null;
}

function premiumLabel(price: number | null, retail: number | null) {
  if (price == null || retail == null || retail <= 0) return null;
  const pct = (price / retail) * 100 - 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs retail`;
}

function SideCard({
  side,
  slug,
  catalog,
  quote,
  wins,
  loading,
}: {
  side: "A" | "B";
  slug: string;
  catalog: SneakerCatalogEntry | null;
  quote: ReturnType<typeof useCompareMarkets>["left"];
  wins: number;
  loading: boolean;
}) {
  const name = quote?.name ?? catalog?.name ?? slug;
  const ticker = quote?.ticker ?? catalog?.ticker ?? "—";
  const image = quote?.image || catalog?.fallbackImage || "";
  const brand = quote?.brand ?? catalog?.brand ?? "";
  const year = quote?.year ?? catalog?.year;
  const colorway = quote?.colorway ?? catalog?.colorway ?? "";
  const price = quote?.price ?? null;
  const retail = quote?.retail ?? catalog?.retail ?? null;
  const change30d = quote?.change30d ?? null;
  const premium = premiumLabel(price, retail);

  return (
    <article className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-dash-border bg-gradient-to-b from-dash-elevated/90 via-dash-panel/40 to-dash-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            side === "A"
              ? "radial-gradient(ellipse 80% 55% at 20% 0%, rgba(212,160,23,0.18), transparent 60%)"
              : "radial-gradient(ellipse 80% 55% at 80% 0%, rgba(56,189,248,0.14), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-2 px-4 pt-4 sm:px-5">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-dash-faint">
          Side {side}
        </p>
        <p className="rounded-lg border border-dash-border/80 bg-dash-bg/50 px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted">
          {wins} metric{wins === 1 ? "" : "s"} ahead
        </p>
      </div>

      <div className="relative mx-auto mt-2 flex h-36 w-full max-w-[220px] items-center justify-center sm:h-44">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className={`object-contain p-3 transition-opacity duration-300 ${loading ? "opacity-40" : "opacity-100"}`}
            sizes="220px"
            priority={side === "A"}
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-dash-elevated" />
        )}
      </div>

      <div className="relative mt-auto space-y-2 px-4 pb-5 pt-2 sm:px-5">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
          {[brand, year].filter(Boolean).join(" · ")}
        </p>
        <Link
          href={`/sneakers/${slug}`}
          className="block font-[family-name:var(--font-syne)] text-xl font-extrabold tracking-tight text-dash-text hover:underline sm:text-2xl"
        >
          {ticker}
        </Link>
        <p className="line-clamp-2 text-sm text-dash-muted">{name}</p>
        {colorway ? (
          <p className="truncate text-xs text-dash-faint">{colorway}</p>
        ) : null}

        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 border-t border-dash-border/70 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-dash-faint">
              Lowest ask
            </p>
            <p className="font-[family-name:var(--font-plex-mono)] text-2xl font-semibold tabular-nums text-dash-text">
              {loading && price == null ? "…" : formatMaybeMoney(price)}
            </p>
          </div>
          <div className="pb-0.5">
            {change30d != null ? (
              <p
                className={`font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums ${changeClass(change30d)}`}
              >
                {change30d > 0 ? "+" : ""}
                {change30d.toFixed(2)}% 30d
              </p>
            ) : (
              <p className="text-xs text-dash-faint">30d —</p>
            )}
            {premium ? (
              <p className="text-xs text-dash-muted">{premium}</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

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
    left,
    right,
    rows,
    score,
    loading,
    error,
    compare,
  } = useCompareMarkets(initialA, initialB);

  const catalogA = catalogPick(sneakers, a);
  const catalogB = catalogPick(sneakers, b);
  const samePick = a === b;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
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
          disabled={loading || samePick}
          className="self-end rounded-xl bg-dash-accent px-5 py-2.5 text-sm font-semibold text-dash-bg shadow-[var(--shadow-sm)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {samePick ? (
        <p className="text-sm text-dash-down">Pick two different sneakers.</p>
      ) : null}
      {error ? <p className="text-sm text-dash-down">{error}</p> : null}

      {!samePick ? (
        <div className="relative grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <SideCard
            side="A"
            slug={a}
            catalog={catalogA}
            quote={left}
            wins={score.leftWins}
            loading={loading}
          />
          <div className="flex items-center justify-center lg:px-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dash-border bg-dash-surface font-[family-name:var(--font-syne)] text-sm font-extrabold tracking-wide text-dash-accent shadow-[0_0_40px_rgba(212,160,23,0.12)]">
              VS
            </div>
          </div>
          <SideCard
            side="B"
            slug={b}
            catalog={catalogB}
            quote={right}
            wins={score.rightWins}
            loading={loading}
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-dash-border">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-dash-border bg-dash-elevated/50 text-xs font-semibold uppercase tracking-[0.08em] text-dash-faint sm:grid-cols-[1.2fr_1fr_1fr] sm:text-sm sm:normal-case sm:tracking-normal">
            <div className="px-3 py-3 sm:px-4">Metric</div>
            <div className="px-3 py-3 sm:px-4">
              <Link href={`/sneakers/${a}`} className="text-dash-text hover:underline">
                {left?.ticker ?? catalogA?.ticker ?? "A"}
              </Link>
            </div>
            <div className="px-3 py-3 sm:px-4">
              <Link href={`/sneakers/${b}`} className="text-dash-text hover:underline">
                {right?.ticker ?? catalogB?.ticker ?? "B"}
              </Link>
            </div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-dash-border text-sm last:border-b-0 hover:bg-dash-elevated/30 sm:grid-cols-[1.2fr_1fr_1fr]"
            >
              <div className="px-3 py-3 sm:px-4">
                <p className="text-dash-muted">{row.label}</p>
                {row.hint ? (
                  <p className="mt-0.5 hidden text-[11px] text-dash-faint sm:block">
                    {row.hint}
                  </p>
                ) : null}
              </div>
              <div
                className={`px-3 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums sm:px-4 ${
                  row.winner === "left"
                    ? "bg-dash-up/10 text-dash-up"
                    : "text-dash-text"
                }`}
              >
                {row.left}
                {row.winner === "left" ? (
                  <span className="ml-1.5 hidden text-[10px] font-medium uppercase tracking-wide sm:inline">
                    win
                  </span>
                ) : null}
              </div>
              <div
                className={`px-3 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums sm:px-4 ${
                  row.winner === "right"
                    ? "bg-dash-up/10 text-dash-up"
                    : "text-dash-text"
                }`}
              >
                {row.right}
                {row.winner === "right" ? (
                  <span className="ml-1.5 hidden text-[10px] font-medium uppercase tracking-wide sm:inline">
                    win
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : !samePick ? (
        <p className="text-sm text-dash-muted">
          {loading
            ? "Loading live StockX quotes…"
            : "Quotes will appear once both markets load."}
        </p>
      ) : null}
    </div>
  );
}

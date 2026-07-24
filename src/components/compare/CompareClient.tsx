"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_COMPARE,
  MIN_COMPARE,
  useCompareMarkets,
  type CompareQuote,
} from "@/hooks/useCompareMarkets";
import type { SneakerCatalogEntry } from "@/types/catalog";
import { changeClass, formatMaybeMoney } from "@/utils/format";

const CARD_GLOWS = [
  "rgba(212,160,23,0.18)",
  "rgba(56,189,248,0.14)",
  "rgba(38,166,154,0.16)",
  "rgba(244,114,182,0.14)",
  "rgba(167,139,250,0.16)",
];

function catalogPick(sneakers: SneakerCatalogEntry[], slug: string) {
  return sneakers.find((s) => s.slug === slug) ?? null;
}

function filterEntries(sneakers: SneakerCatalogEntry[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return sneakers;
  return sneakers.filter((row) => {
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

function premiumLabel(price: number | null, retail: number | null) {
  if (price == null || retail == null || retail <= 0) return null;
  const pct = (price / retail) * 100 - 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs retail`;
}

function SideCard({
  index,
  slug,
  catalog,
  quote,
  wins,
  loading,
  canRemove,
  onRemove,
}: {
  index: number;
  slug: string;
  catalog: SneakerCatalogEntry | null;
  quote: CompareQuote | null;
  wins: number;
  loading: boolean;
  canRemove: boolean;
  onRemove: () => void;
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
  const glow = CARD_GLOWS[index % CARD_GLOWS.length];

  return (
    <article className="relative flex min-h-[260px] min-w-[220px] flex-1 flex-col overflow-hidden rounded-2xl border border-dash-border bg-gradient-to-b from-dash-elevated/90 via-dash-panel/40 to-dash-bg sm:min-w-[240px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 55% at ${index % 2 === 0 ? "20%" : "80%"} 0%, ${glow}, transparent 60%)`,
        }}
      />
      <div className="relative flex items-center justify-between gap-2 px-4 pt-4">
        <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-dash-faint">
          Pair {index + 1}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="rounded-lg border border-dash-border/80 bg-dash-bg/50 px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted">
            {wins} win{wins === 1 ? "" : "s"}
          </p>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${ticker}`}
              className="rounded-lg border border-dash-border px-1.5 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted hover:border-dash-down/50 hover:text-dash-down"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative mx-auto mt-2 flex h-32 w-full max-w-[200px] items-center justify-center sm:h-36">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className={`object-contain p-3 transition-opacity duration-300 ${loading ? "opacity-40" : "opacity-100"}`}
            sizes="200px"
            priority={index === 0}
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-dash-elevated" />
        )}
      </div>

      <div className="relative mt-auto space-y-2 px-4 pb-4 pt-2">
        <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
          {[brand, year].filter(Boolean).join(" · ")}
        </p>
        <Link
          href={`/sneakers/${slug}`}
          className="block font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-dash-text hover:underline sm:text-xl"
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
            <p className="font-[family-name:var(--font-plex-mono)] text-xl font-semibold tabular-nums text-dash-text">
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

function PairSearchPicker({
  sneakers,
  selected,
  canAdd,
  onAdd,
  onRemove,
}: {
  sneakers: SneakerCatalogEntry[];
  selected: string[];
  canAdd: boolean;
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const matches = useMemo(() => {
    return filterEntries(sneakers, q)
      .filter((row) => !selectedSet.has(row.slug))
      .slice(0, 8);
  }, [sneakers, q, selectedSet]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((slug) => {
          const entry = catalogPick(sneakers, slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onRemove(slug)}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-dash-elevated/60 px-3 py-1.5 text-left transition-colors hover:border-dash-down/40 hover:bg-dash-elevated"
              title="Remove from compare"
            >
              <span className="font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
                {entry?.ticker ?? slug}
              </span>
              <span className="max-w-[10rem] truncate text-xs text-dash-muted">
                {entry?.name ?? slug}
              </span>
              <span className="text-dash-faint" aria-hidden>
                ×
              </span>
            </button>
          );
        })}
        {selected.length === 0 ? (
          <p className="text-sm text-dash-muted">
            Search and add at least {MIN_COMPARE} pairs to compare.
          </p>
        ) : null}
      </div>

      <div ref={rootRef} className="relative max-w-xl">
        <label className="block text-sm text-dash-muted">
          Search board
          <input
            type="search"
            value={q}
            disabled={!canAdd}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              canAdd
                ? "Name, style ID, brand…"
                : `Max ${MAX_COMPARE} pairs — remove one to add another`
            }
            className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        {open && canAdd ? (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-dash-border bg-dash-surface shadow-[var(--shadow-md)]">
            {matches.length === 0 ? (
              <li className="px-3 py-3 text-sm text-dash-muted">
                {q.trim()
                  ? `No board matches for “${q.trim()}”.`
                  : "Type to filter the board."}
              </li>
            ) : (
              matches.map((row) => (
                <li key={row.slug}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-dash-elevated"
                    onClick={() => {
                      onAdd(row.slug);
                      setQ("");
                      setOpen(false);
                    }}
                  >
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-dash-bg">
                      {row.fallbackImage ? (
                        <Image
                          src={row.fallbackImage}
                          alt=""
                          fill
                          className="object-contain p-1"
                          sizes="36px"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-dash-text">
                        {row.name}
                      </span>
                      <span className="block truncate font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
                        {row.ticker}
                        {row.rank != null ? ` · #${row.rank}` : ""}
                      </span>
                    </span>
                    <span className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
                      Add
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
        {selected.length}/{MAX_COMPARE} selected · {MIN_COMPARE}–{MAX_COMPARE}{" "}
        pairs
      </p>
    </div>
  );
}

export function CompareClient({
  sneakers,
  initialSlugs,
  onSlugsChange,
}: {
  sneakers: SneakerCatalogEntry[];
  initialSlugs: string[];
  onSlugsChange?: (slugs: string[]) => void;
}) {
  const {
    slugs,
    addSlug,
    removeSlug,
    quotes,
    rows,
    winCounts,
    loading,
    error,
    compare,
    canAdd,
    ready,
  } = useCompareMarkets(initialSlugs);

  const onSlugsChangeRef = useRef(onSlugsChange);
  onSlugsChangeRef.current = onSlugsChange;

  useEffect(() => {
    onSlugsChangeRef.current?.(slugs);
  }, [slugs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <PairSearchPicker
            sneakers={sneakers}
            selected={slugs}
            canAdd={canAdd}
            onAdd={addSlug}
            onRemove={removeSlug}
          />
        </div>
        <button
          type="button"
          onClick={compare}
          disabled={loading || !ready}
          className="shrink-0 self-start rounded-xl bg-dash-accent px-5 py-2.5 text-sm font-semibold text-dash-bg shadow-[var(--shadow-sm)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 lg:mt-6"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!ready ? (
        <p className="text-sm text-dash-muted">
          Add at least {MIN_COMPARE} different pairs to run a compare.
        </p>
      ) : null}
      {error ? <p className="text-sm text-dash-down">{error}</p> : null}

      {ready ? (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {slugs.map((slug, index) => (
            <SideCard
              key={slug}
              index={index}
              slug={slug}
              catalog={catalogPick(sneakers, slug)}
              quote={quotes[slug] ?? null}
              wins={winCounts[slug] ?? 0}
              loading={loading}
              canRemove={slugs.length > MIN_COMPARE}
              onRemove={() => removeSlug(slug)}
            />
          ))}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <section className="overflow-x-auto rounded-2xl border border-dash-border">
          <div
            className="min-w-max border-b border-dash-border bg-dash-elevated/50 text-xs font-semibold uppercase tracking-[0.08em] text-dash-faint sm:text-sm sm:normal-case sm:tracking-normal"
            style={{
              display: "grid",
              gridTemplateColumns: `minmax(8rem,1.2fr) repeat(${slugs.length}, minmax(7.5rem,1fr))`,
            }}
          >
            <div className="px-3 py-3 sm:px-4">Metric</div>
            {slugs.map((slug) => {
              const quote = quotes[slug];
              const catalog = catalogPick(sneakers, slug);
              return (
                <div key={slug} className="px-3 py-3 sm:px-4">
                  <Link
                    href={`/sneakers/${slug}`}
                    className="text-dash-text hover:underline"
                  >
                    {quote?.ticker ?? catalog?.ticker ?? slug}
                  </Link>
                </div>
              );
            })}
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="min-w-max border-b border-dash-border text-sm last:border-b-0 hover:bg-dash-elevated/30"
              style={{
                display: "grid",
                gridTemplateColumns: `minmax(8rem,1.2fr) repeat(${slugs.length}, minmax(7.5rem,1fr))`,
              }}
            >
              <div className="px-3 py-3 sm:px-4">
                <p className="text-dash-muted">{row.label}</p>
                {row.hint ? (
                  <p className="mt-0.5 hidden text-[11px] text-dash-faint sm:block">
                    {row.hint}
                  </p>
                ) : null}
              </div>
              {row.cells.map((cell) => {
                const isWin = row.winnerSlugs.includes(cell.slug);
                return (
                  <div
                    key={`${row.label}-${cell.slug}`}
                    className={`px-3 py-3 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums sm:px-4 ${
                      isWin ? "bg-dash-up/10 text-dash-up" : "text-dash-text"
                    }`}
                  >
                    {cell.display}
                    {isWin ? (
                      <span className="ml-1.5 hidden text-[10px] font-medium uppercase tracking-wide sm:inline">
                        win
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      ) : ready ? (
        <p className="text-sm text-dash-muted">
          {loading
            ? "Loading live StockX quotes…"
            : "Quotes will appear once markets load."}
        </p>
      ) : null}
    </div>
  );
}

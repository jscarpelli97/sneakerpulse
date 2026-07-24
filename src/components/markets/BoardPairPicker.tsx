"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCatalogSearch,
  type CatalogSearchHit,
} from "@/hooks/useCatalogSearch";
import { rememberCatalogHit } from "@/lib/catalog/rememberClient";
import type { SneakerCatalogEntry } from "@/types/catalog";

export const TOP_SELLERS_QUICK_LIMIT = 10;

export type PairSuggestion = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  fallbackImage: string;
  rank?: number | null;
  origin: "board" | "catalog";
};

export function topSellers(
  sneakers: SneakerCatalogEntry[],
  limit = TOP_SELLERS_QUICK_LIMIT,
) {
  return [...sneakers]
    .sort((a, b) => {
      const ar = a.rank ?? Number.POSITIVE_INFINITY;
      const br = b.rank ?? Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function filterBoardEntries(
  sneakers: SneakerCatalogEntry[],
  query: string,
) {
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

function toBoardSuggestion(row: SneakerCatalogEntry): PairSuggestion {
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    ticker: row.ticker,
    fallbackImage: row.fallbackImage,
    rank: row.rank,
    origin: "board",
  };
}

function toCatalogSuggestion(row: CatalogSearchHit): PairSuggestion {
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    ticker: row.ticker,
    fallbackImage: row.fallbackImage,
    origin: "catalog",
  };
}

/**
 * Board-local suggestions instantly; catalog/KicksDB only after 2+ chars
 * (debounced inside useCatalogSearch — never polls).
 */
export function usePairSuggestions({
  sneakers,
  query,
  enabled,
  exclude = [],
  limit = 8,
}: {
  sneakers: SneakerCatalogEntry[];
  query: string;
  enabled: boolean;
  exclude?: string[];
  limit?: number;
}) {
  const q = query.trim();
  const liveEnabled = enabled && q.length >= 2;
  const { hits, busy, source } = useCatalogSearch(query, liveEnabled);
  const excludeSet = useMemo(() => new Set(exclude), [exclude]);

  const suggestions = useMemo(() => {
    const out: PairSuggestion[] = [];
    const seen = new Set<string>();

    const push = (hit: PairSuggestion) => {
      if (excludeSet.has(hit.slug) || seen.has(hit.slug)) return;
      seen.add(hit.slug);
      out.push(hit);
    };

    if (q.length < 2) {
      const local = q
        ? filterBoardEntries(sneakers, q)
        : topSellers(sneakers, limit);
      for (const row of local.slice(0, limit)) push(toBoardSuggestion(row));
      return out;
    }

    // Prefer live/catalog hits when typing 2+ chars; keep board matches first.
    for (const row of filterBoardEntries(sneakers, q)) {
      push(toBoardSuggestion(row));
      if (out.length >= limit) return out;
    }
    for (const row of hits) {
      push(toCatalogSuggestion(row));
      if (out.length >= limit) break;
    }
    return out;
  }, [sneakers, q, hits, excludeSet, limit]);

  return { suggestions, busy, source };
}

/** Dropdown of the current top sellers for one-tap add/select. */
export function TopSellersQuickPick({
  sneakers,
  exclude = [],
  limit = TOP_SELLERS_QUICK_LIMIT,
  disabled = false,
  onPick,
}: {
  sneakers: SneakerCatalogEntry[];
  exclude?: string[];
  limit?: number;
  disabled?: boolean;
  onPick: (slug: string) => void;
}) {
  const excludeSet = useMemo(() => new Set(exclude), [exclude]);
  const options = useMemo(
    () => topSellers(sneakers, limit).filter((row) => !excludeSet.has(row.slug)),
    [sneakers, limit, excludeSet],
  );

  return (
    <label className="block max-w-xl text-sm text-dash-muted">
      Quick pick · top {limit}
      <select
        disabled={disabled || options.length === 0}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          onPick(value);
          event.target.value = "";
        }}
        className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none hover:border-dash-muted focus:border-dash-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {options.length === 0
            ? "No top sellers left to add"
            : "Choose a top seller…"}
        </option>
        {options.map((row, index) => (
          <option key={row.slug} value={row.slug}>
            #{index + 1} · {row.ticker} · {row.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SuggestionList({
  suggestions,
  busy,
  query,
  emptyHint,
  actionLabel,
  onPick,
}: {
  suggestions: PairSuggestion[];
  busy: boolean;
  query: string;
  emptyHint: string;
  actionLabel: string;
  onPick: (hit: PairSuggestion) => void;
}) {
  const q = query.trim();
  return (
    <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-dash-border bg-dash-surface shadow-[var(--shadow-md)]">
      {busy && suggestions.length === 0 ? (
        <li className="px-3 py-3 text-sm text-dash-muted">Searching…</li>
      ) : suggestions.length === 0 ? (
        <li className="px-3 py-3 text-sm text-dash-muted">
          {q.length >= 2
            ? `No matches for “${q}”.`
            : emptyHint}
        </li>
      ) : (
        suggestions.map((row) => (
          <li key={row.slug}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-dash-elevated"
              onClick={() => onPick(row)}
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
                  {row.origin === "catalog" ? " · catalog" : ""}
                </span>
              </span>
              <span className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
                {actionLabel}
              </span>
            </button>
          </li>
        ))
      )}
      {busy && suggestions.length > 0 ? (
        <li className="border-t border-dash-border px-3 py-2 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-faint">
          Updating results…
        </li>
      ) : null}
    </ul>
  );
}

/** Searchable combobox — board first; any pair after you type (debounced). */
export function BoardPairSearch({
  sneakers,
  selectedSlug = "",
  selectedLabel,
  exclude = [],
  disabled = false,
  placeholder = "Type a name or style ID…",
  onSelect,
}: {
  sneakers: SneakerCatalogEntry[];
  selectedSlug?: string;
  /** Optional label when the pick isn’t on the Markets board. */
  selectedLabel?: string | null;
  exclude?: string[];
  disabled?: boolean;
  placeholder?: string;
  onSelect: (slug: string, hit?: PairSuggestion) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PairSuggestion | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { suggestions, busy } = usePairSuggestions({
    sneakers,
    query: q,
    enabled: open && !disabled,
    exclude,
    limit: 10,
  });

  const selected =
    sneakers.find((row) => row.slug === selectedSlug) ??
    (picked?.slug === selectedSlug ? picked : null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative max-w-xl">
      <label className="block text-sm text-dash-muted">
        Search any pair
        <input
          type="search"
          value={q}
          disabled={disabled}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            selected
              ? `${selected.ticker} · ${selected.name}`
              : selectedLabel || placeholder
          }
          className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
      <p className="mt-1.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
        Board matches instantly · catalog lookup after 2+ characters
      </p>
      {selectedSlug && !open ? (
        <p className="mt-2 font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
          Selected · {selected?.ticker ?? selectedSlug}
          <button
            type="button"
            className="ml-2 text-dash-faint underline-offset-2 hover:text-dash-muted hover:underline"
            onClick={() => {
              setPicked(null);
              onSelect("");
            }}
          >
            Clear
          </button>
        </p>
      ) : null}
      {open && !disabled ? (
        <SuggestionList
          suggestions={suggestions}
          busy={busy}
          query={q}
          emptyHint="Type at least 2 characters to search beyond the board."
          actionLabel="Select"
          onPick={(hit) => {
            rememberCatalogHit(hit);
            setPicked(hit);
            onSelect(hit.slug, hit);
            setQ("");
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Multi-select for Compare — same any-pair search rules. */
export function BoardPairMultiSearch({
  sneakers,
  selected,
  knownLabels,
  canAdd,
  onAdd,
  onRemove,
  minCount,
  maxCount,
}: {
  sneakers: SneakerCatalogEntry[];
  selected: string[];
  knownLabels?: Record<string, { ticker: string; name: string }>;
  canAdd: boolean;
  onAdd: (slug: string, hit?: PairSuggestion) => void;
  onRemove: (slug: string) => void;
  minCount: number;
  maxCount: number;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { suggestions, busy } = usePairSuggestions({
    sneakers,
    query: q,
    enabled: open && canAdd,
    exclude: selected,
    limit: 10,
  });

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
          const entry = sneakers.find((row) => row.slug === slug);
          const known = knownLabels?.[slug];
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onRemove(slug)}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-dash-elevated/60 px-3 py-1.5 text-left transition-colors hover:border-dash-down/40 hover:bg-dash-elevated"
              title="Remove from compare"
            >
              <span className="font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
                {entry?.ticker ?? known?.ticker ?? slug}
              </span>
              <span className="max-w-[10rem] truncate text-xs text-dash-muted">
                {entry?.name ?? known?.name ?? slug}
              </span>
              <span className="text-dash-faint" aria-hidden>
                ×
              </span>
            </button>
          );
        })}
        {selected.length === 0 ? (
          <p className="text-sm text-dash-muted">
            Search and add at least {minCount} pairs to compare.
          </p>
        ) : null}
      </div>

      <div ref={rootRef} className="relative max-w-xl">
        <label className="block text-sm text-dash-muted">
          Search any pair
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
                ? "Type a name or style ID…"
                : `Max ${maxCount} pairs — remove one to add another`
            }
            className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <p className="mt-1.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
          Board matches instantly · catalog lookup after 2+ characters
        </p>
        {open && canAdd ? (
          <SuggestionList
            suggestions={suggestions}
            busy={busy}
            query={q}
            emptyHint="Type at least 2 characters to search beyond the board."
            actionLabel="Add"
            onPick={(hit) => {
              rememberCatalogHit(hit);
              onAdd(hit.slug, hit);
              setQ("");
              setOpen(false);
            }}
          />
        ) : null}
      </div>
      <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
        {selected.length}/{maxCount} selected · {minCount}–{maxCount} pairs
      </p>
      <TopSellersQuickPick
        sneakers={sneakers}
        exclude={selected}
        disabled={!canAdd}
        onPick={(slug) => onAdd(slug)}
      />
    </div>
  );
}

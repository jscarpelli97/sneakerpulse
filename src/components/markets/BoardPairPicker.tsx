"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SneakerCatalogEntry } from "@/types/catalog";

export const TOP_SELLERS_QUICK_LIMIT = 10;

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

/** Searchable board combobox — pick one pair. */
export function BoardPairSearch({
  sneakers,
  selectedSlug = "",
  exclude = [],
  disabled = false,
  placeholder = "Name, style ID, brand…",
  onSelect,
}: {
  sneakers: SneakerCatalogEntry[];
  selectedSlug?: string;
  exclude?: string[];
  disabled?: boolean;
  placeholder?: string;
  onSelect: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const excludeSet = useMemo(() => new Set(exclude), [exclude]);
  const selected = sneakers.find((row) => row.slug === selectedSlug) ?? null;

  const matches = useMemo(() => {
    return filterBoardEntries(sneakers, q)
      .filter((row) => !excludeSet.has(row.slug))
      .slice(0, 8);
  }, [sneakers, q, excludeSet]);

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
        Search board
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
              : placeholder
          }
          className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
      {selected && !open ? (
        <p className="mt-2 font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
          Selected · {selected.ticker}
          <button
            type="button"
            className="ml-2 text-dash-faint underline-offset-2 hover:text-dash-muted hover:underline"
            onClick={() => onSelect("")}
          >
            Clear
          </button>
        </p>
      ) : null}
      {open && !disabled ? (
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
                    onSelect(row.slug);
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
                    Select
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

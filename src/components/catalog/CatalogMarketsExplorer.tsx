"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import {
  filterCatalogRows,
  sortCatalogRows,
  type CatalogSortDir,
  type CatalogSortKey,
} from "@/utils/catalogTable";
import { formatMaybeMoney, formatNumber } from "@/utils/format";

type SortableColumn = {
  key: CatalogSortKey;
  label: string;
  className?: string;
};

const COLUMNS: SortableColumn[] = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Name" },
  { key: "ticker", label: "Ticker" },
  { key: "price", label: "Lowest ask" },
  { key: "weeklyOrders", label: "Weekly orders" },
  { key: "status", label: "Status" },
];

export function CatalogMarketsExplorer({
  rows,
  initialQuery = "",
}: {
  rows: CatalogQuote[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sortKey, setSortKey] = useState<CatalogSortKey>("rank");
  const [sortDir, setSortDir] = useState<CatalogSortDir>("asc");
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    return sortCatalogRows(filterCatalogRows(rows, query), sortKey, sortDir);
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: CatalogSortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(
      key === "price" || key === "weeklyOrders" || key === "status"
        ? "desc"
        : "asc",
    );
  }

  function onQueryChange(value: string) {
    setQuery(value);
    startTransition(() => {
      const next = value.trim();
      router.replace(next ? `/markets?q=${encodeURIComponent(next)}` : "/markets");
    });
  }

  return (
    <section className="dash-card animate-rise overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-dash-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-5">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-dash-text sm:text-xl">
            All markets
          </h1>
          <p className="mt-1 text-sm text-dash-muted">
            Top {rows.length} StockX sneakers by sales rank — search and sort
            any column
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="markets-search">
            Search markets
          </label>
          <input
            id="markets-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Name, ticker, brand, SKU…"
            className="w-full min-w-[220px] rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent sm:w-72"
          />
          <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
            {visible.length} shown
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dash-border bg-dash-elevated/60 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-faint">
            <tr>
              <th className="px-4 py-3.5 font-medium sm:px-5">#</th>
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th key={col.key} className="px-4 py-3.5 font-medium sm:px-5">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-dash-text ${
                        active ? "text-dash-accent" : "text-dash-faint"
                      }`}
                    >
                      {col.label}
                      <span aria-hidden className="text-[10px] opacity-80">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "◇"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--dash-border-subtle)]">
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-dash-muted sm:px-5"
                >
                  No pairs match “{query.trim()}”.
                </td>
              </tr>
            ) : (
              visible.map((row, index) => (
                <tr
                  key={row.slug}
                  className="group transition-colors hover:bg-dash-elevated/55"
                >
                  <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-faint sm:px-5">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                    {row.live && row.rank != null ? `#${row.rank}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <Link
                      href={`/sneakers/${row.slug}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-elevated transition-transform group-hover:scale-[1.03]">
                        <Image
                          src={row.fallbackImage}
                          alt={row.name}
                          fill
                          className="object-contain p-1"
                          sizes="44px"
                        />
                      </span>
                      <span>
                        <span className="block font-semibold text-dash-text transition-colors group-hover:text-white">
                          {row.name}
                        </span>
                        <span className="block text-xs text-dash-faint">
                          {row.brand} · {row.styleCode} · {row.year}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-medium text-dash-accent sm:px-5">
                    {row.ticker}
                  </td>
                  <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text sm:px-5">
                    {row.live ? formatMaybeMoney(row.price) : "—"}
                  </td>
                  <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                    {row.live && row.weeklyOrders != null
                      ? formatNumber(row.weeklyOrders)
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] ${
                        row.live
                          ? "bg-[rgba(38,166,154,0.12)] text-dash-up"
                          : "bg-dash-elevated text-dash-faint"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          row.live ? "animate-blink bg-dash-up" : "bg-dash-faint"
                        }`}
                      />
                      {row.live ? "Live" : "Offline"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

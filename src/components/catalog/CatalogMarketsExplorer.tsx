"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CompareClient } from "@/components/compare/CompareClient";
import { SneakerThumb } from "@/components/catalog/SneakerThumb";
import { MarketsDealCheck } from "@/components/markets/MarketsDealCheck";
import { MAX_COMPARE } from "@/hooks/useCompareMarkets";
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
};

type BrowseLayout = "columns" | "icons";
type MarketsFocus = "browse" | "compare" | "deal";

const LAYOUT_STORAGE_KEY = "spi-markets-view";
const PAGE_SIZE_STORAGE_KEY = "spi-markets-page-size";
const PAGE_SIZES = [10, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 10;

const COLUMNS: SortableColumn[] = [
  { key: "rank", label: "#" },
  { key: "name", label: "Name" },
  { key: "ticker", label: "Style ID" },
  { key: "price", label: "Lowest ask" },
  { key: "weeklyOrders", label: "Weekly orders" },
  { key: "status", label: "Status" },
];

function isPageSize(value: unknown): value is PageSize {
  return PAGE_SIZES.includes(value as PageSize);
}

function StatusPill({ row }: { row: CatalogQuote }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] ${
        row.live
          ? "bg-[rgba(38,166,154,0.12)] text-dash-up"
          : row.price != null
            ? "bg-[rgba(212,160,23,0.12)] text-dash-accent"
            : "bg-dash-elevated text-dash-faint"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          row.live
            ? "animate-blink bg-dash-up"
            : row.price != null
              ? "bg-dash-accent"
              : "bg-dash-faint"
        }`}
      />
      {row.live ? "Live" : row.price != null ? "Snapshot" : "Offline"}
    </span>
  );
}

function BoardPager({
  page,
  pageCount,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: PageSize;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-faint">
        {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex items-center gap-1"
          role="group"
          aria-label="Rows per page"
        >
          <span className="mr-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
            Per page
          </span>
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSize(size)}
              aria-pressed={pageSize === size}
              className={`rounded-lg px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] tabular-nums tracking-[0.08em] transition-colors ${
                pageSize === size
                  ? "bg-dash-accent text-dash-bg"
                  : "border border-dash-border text-dash-muted hover:text-dash-text"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {pageCount > 1 ? (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-dash-border px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted transition-colors hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="min-w-[4.5rem] text-center font-[family-name:var(--font-plex-mono)] text-[11px] tabular-nums text-dash-faint">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPage(page + 1)}
              disabled={page >= pageCount}
              className="rounded-lg border border-dash-border px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted transition-colors hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionIntro({
  id,
  index,
  title,
  blurb,
}: {
  id: string;
  index: string;
  title: string;
  blurb: string;
}) {
  return (
    <div id={id} className="scroll-mt-28 space-y-1 px-4 pt-5 sm:px-5">
      <p className="font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-dash-faint">
        {index} · {title}
      </p>
      <p className="max-w-2xl text-sm text-dash-muted">{blurb}</p>
    </div>
  );
}

function defaultCompareSlugs(
  rows: CatalogQuote[],
  seed: string[] = [],
): string[] {
  const out: string[] = [];
  for (const slug of seed) {
    if (rows.some((r) => r.slug === slug) && !out.includes(slug)) {
      out.push(slug);
    }
  }
  for (const row of rows) {
    if (out.length >= 2) break;
    if (!out.includes(row.slug)) out.push(row.slug);
  }
  return out.slice(0, MAX_COMPARE);
}

function scrollToSection(id: MarketsFocus) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function CatalogMarketsExplorer({
  rows,
  initialQuery = "",
  initialFocus = "browse",
  initialCompareSlugs = [],
  initialDealSlug,
}: {
  rows: CatalogQuote[];
  initialQuery?: string;
  initialFocus?: MarketsFocus;
  initialCompareSlugs?: string[];
  initialDealSlug?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sortKey, setSortKey] = useState<CatalogSortKey>("rank");
  const [sortDir, setSortDir] = useState<CatalogSortDir>("asc");
  const [layout, setLayout] = useState<BrowseLayout>("columns");
  const [compareSlugs, setCompareSlugs] = useState(() =>
    defaultCompareSlugs(rows, initialCompareSlugs),
  );
  const [compareKey, setCompareKey] = useState(0);
  const [dealSeed, setDealSeed] = useState<string | null>(
    initialDealSlug && rows.some((r) => r.slug === initialDealSlug)
      ? initialDealSlug
      : null,
  );
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved === "columns" || saved === "icons") setLayout(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
      if (isPageSize(saved)) setPageSize(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (initialFocus === "compare" || initialFocus === "deal") {
      scrollToSection(initialFocus);
    }
  }, [initialFocus]);

  function syncUrl(next: {
    q?: string;
    compare?: string[];
    dealSlug?: string | null;
    focus?: MarketsFocus;
  }) {
    const params = new URLSearchParams();
    const q = (next.q ?? query).trim();
    if (q) params.set("q", q);
    const compare = next.compare ?? compareSlugs;
    if (compare.length) params.set("s", compare.join(","));
    const deal =
      next.dealSlug === undefined
        ? dealSeed
        : next.dealSlug;
    if (deal) params.set("slug", deal);
    const focus = next.focus;
    if (focus === "compare" || focus === "deal") params.set("view", focus);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/markets?${qs}` : "/markets", { scroll: false });
    });
  }

  function setBrowseLayout(next: BrowseLayout) {
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function openCompareWith(slug: string) {
    const next = defaultCompareSlugs(rows, [
      slug,
      ...compareSlugs.filter((s) => s !== slug),
    ]);
    setCompareSlugs(next);
    setCompareKey((key) => key + 1);
    syncUrl({ compare: next, focus: "compare" });
    scrollToSection("compare");
  }

  function openDealWith(slug: string) {
    setDealSeed(slug);
    syncUrl({ dealSlug: slug, focus: "deal" });
    scrollToSection("deal");
  }

  const visible = useMemo(() => {
    return sortCatalogRows(filterCatalogRows(rows, query), sortKey, sortDir);
  }, [rows, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageOffset = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageOffset, pageOffset + pageSize);
  const rangeStart = visible.length === 0 ? 0 : pageOffset + 1;
  const rangeEnd = Math.min(pageOffset + pageRows.length, visible.length);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  function toggleSort(key: CatalogSortKey) {
    setPage(1);
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
    setPage(1);
    syncUrl({ q: value });
  }

  function changePageSize(size: PageSize) {
    setPageSize(size);
    setPage(1);
    try {
      window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    } catch {
      /* ignore */
    }
  }

  const pager = (
    <BoardPager
      page={safePage}
      pageCount={pageCount}
      pageSize={pageSize}
      total={visible.length}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      onPage={setPage}
      onPageSize={changePageSize}
    />
  );

  return (
    <div className="space-y-6">
      <nav
        className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 flex flex-wrap gap-2 rounded-2xl border border-dash-border bg-dash-surface/95 p-2 shadow-[var(--shadow-sm)] backdrop-blur-xl"
        aria-label="Markets sections"
      >
        {(
          [
            ["browse", "Browse"],
            ["compare", "Compare"],
            ["deal", "Deal"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              syncUrl({ focus: id === "browse" ? undefined : id });
              scrollToSection(id);
            }}
            className="rounded-xl px-3 py-2 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-muted transition-colors hover:bg-dash-elevated hover:text-dash-text"
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="dash-card animate-rise overflow-hidden">
        <SectionIntro
          id="browse"
          index="01"
          title="Browse"
          blurb={`${rows.length} pairs on the board — Columns or Icons, paged so you can scan without drowning.`}
        />
        <div className="flex flex-col gap-4 border-b border-dash-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-5">
          <p className="text-sm text-dash-muted">
            {visible.length === rows.length
              ? `${rows.length} pairs`
              : `${visible.length} of ${rows.length} pairs`}
            {layout === "columns" ? (
              <span className="text-dash-faint"> · hover a thumb to enlarge</span>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex rounded-xl border border-dash-border bg-dash-elevated p-1"
              role="group"
              aria-label="Browse layout"
            >
              {(
                [
                  ["columns", "Columns"],
                  ["icons", "Icons"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBrowseLayout(id)}
                  aria-pressed={layout === id}
                  className={`rounded-lg px-3 py-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    layout === id
                      ? "bg-dash-accent text-dash-bg"
                      : "text-dash-muted hover:text-dash-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="markets-search">
              Search markets
            </label>
            <input
              id="markets-search"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Name, style ID, brand…"
              className="w-full min-w-[220px] rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-faint hover:border-dash-muted focus:border-dash-accent sm:w-72"
            />
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="border-b border-dash-border px-4 py-3 sm:px-5">
            {pager}
          </div>
        ) : null}

        {layout === "columns" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-dash-border bg-dash-elevated/60 font-[family-name:var(--font-plex-mono)] text-[11px] uppercase tracking-[0.12em] text-dash-faint">
                <tr>
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className="px-4 py-3.5 font-medium sm:px-5"
                      >
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
                  <th className="px-4 py-3.5 font-medium sm:px-5"> </th>
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
                  pageRows.map((row, index) => (
                    <tr
                      key={row.slug}
                      className="group transition-colors hover:bg-dash-elevated/55"
                    >
                      <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                        {pageOffset + index + 1}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <Link
                          href={`/sneakers/${row.slug}`}
                          className="flex items-center gap-3"
                        >
                          <SneakerThumb
                            src={row.fallbackImage}
                            alt={row.name}
                            size={44}
                            previewWidth={300}
                          />
                          <span>
                            <span className="block font-semibold text-dash-text transition-colors group-hover:text-white">
                              {row.name}
                            </span>
                            <span className="block text-xs text-dash-faint">
                              {row.brand}
                              {row.colorway && row.colorway !== "—"
                                ? ` · ${row.colorway}`
                                : ""}
                              {row.rank != null
                                ? ` · StockX #${row.rank}`
                                : ""}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-medium text-dash-accent sm:px-5">
                        {row.ticker}
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] font-semibold tabular-nums text-dash-text sm:px-5">
                        {row.price != null
                          ? formatMaybeMoney(row.price)
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-plex-mono)] tabular-nums text-dash-muted sm:px-5">
                        {row.weeklyOrders != null
                          ? formatNumber(row.weeklyOrders)
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <StatusPill row={row} />
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => openCompareWith(row.slug)}
                            className="rounded-lg border border-dash-border px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted hover:border-dash-muted hover:text-dash-text"
                          >
                            Vs
                          </button>
                          <button
                            type="button"
                            onClick={() => openDealWith(row.slug)}
                            className="rounded-lg border border-dash-border px-2 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted hover:border-dash-muted hover:text-dash-text"
                          >
                            Deal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            {visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-dash-muted">
                No pairs match “{query.trim()}”.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`rounded-lg border px-2.5 py-1 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] transition-colors ${
                          active
                            ? "border-dash-accent text-dash-accent"
                            : "border-dash-border text-dash-faint hover:text-dash-text"
                        }`}
                      >
                        {col.label}
                        {active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    );
                  })}
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {pageRows.map((row, index) => (
                    <li key={row.slug} className="relative">
                      <Link
                        href={`/sneakers/${row.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dash-border bg-dash-elevated/25 transition-colors hover:border-dash-muted hover:bg-dash-elevated/55"
                      >
                        <div className="relative aspect-[7/5] border-b border-dash-border bg-dash-bg/60">
                          <Image
                            src={row.fallbackImage}
                            alt={row.name}
                            fill
                            className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          />
                          <span className="absolute left-2 top-2 rounded-md bg-dash-bg/85 px-1.5 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] tabular-nums text-dash-muted backdrop-blur-sm">
                            #{pageOffset + index + 1}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5 p-3">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-dash-text transition-colors group-hover:text-white">
                            {row.name}
                          </p>
                          <p className="truncate font-[family-name:var(--font-plex-mono)] text-[11px] text-dash-accent">
                            {row.ticker}
                          </p>
                          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                            <p className="font-[family-name:var(--font-plex-mono)] text-sm font-semibold tabular-nums text-dash-text">
                              {row.price != null
                                ? formatMaybeMoney(row.price)
                                : "—"}
                            </p>
                            <StatusPill row={row} />
                          </div>
                        </div>
                      </Link>
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => openCompareWith(row.slug)}
                          className="rounded-md border border-dash-border bg-dash-bg/90 px-1.5 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted backdrop-blur-sm hover:text-dash-text"
                        >
                          Vs
                        </button>
                        <button
                          type="button"
                          onClick={() => openDealWith(row.slug)}
                          className="rounded-md border border-dash-border bg-dash-bg/90 px-1.5 py-0.5 font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-dash-muted backdrop-blur-sm hover:text-dash-text"
                        >
                          Deal
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {visible.length > 0 ? (
          <div className="border-t border-dash-border px-4 py-3 sm:px-5">
            {pager}
          </div>
        ) : null}
      </section>

      <section className="dash-card animate-rise overflow-hidden">
        <SectionIntro
          id="compare"
          index="02"
          title="Compare"
          blurb="Search the board or quick-pick top sellers — stack 2–5 pairs on ask, premium, volume, and rank."
        />
        <div className="p-4 sm:p-5">
          {rows.length < 2 ? (
            <p className="py-10 text-center text-sm text-dash-muted">
              Need at least two pairs on the board to compare.
            </p>
          ) : (
            <CompareClient
              key={compareKey}
              sneakers={rows}
              initialSlugs={compareSlugs}
              onSlugsChange={(next) => {
                setCompareSlugs(next);
                syncUrl({ compare: next });
              }}
            />
          )}
        </div>
      </section>

      <section className="dash-card animate-rise overflow-hidden">
        <SectionIntro
          id="deal"
          index="03"
          title="Deal check"
          blurb="Search any board pair — or jump from the top-10 list — then size + offer → cop, stretch, or pass."
        />
        <div className="p-4 sm:p-5">
          <MarketsDealCheck
            quotes={rows}
            seedSlug={dealSeed}
            onClearSeed={() => setDealSeed(null)}
            onSlugChange={(next) => {
              syncUrl({ dealSlug: next || null });
            }}
          />
        </div>
      </section>
    </div>
  );
}

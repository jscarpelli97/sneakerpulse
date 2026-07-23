"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ClosetImage } from "@/components/wardrobe/ClosetImage";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { fileToClosetDataUrl } from "@/lib/wardrobe/image";
import {
  getStarterClosetItems,
  type StarterClosetRow,
} from "@/lib/wardrobe/starterCloset";
import {
  CLOSET_KIND_LABELS,
  CLOSET_KINDS,
  type ClosetItem,
  type ClosetItemKind,
} from "@/lib/wardrobe/types";
import { newClosetItemId } from "@/lib/portfolio/vault";
import type { PortfolioHolding } from "@/lib/portfolio/types";

type CatalogRow = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  fallbackImage: string;
};

type AddTab = "picks" | "catalog" | "custom" | "portfolio";

export function ClosetPanel({
  closet,
  holdings,
  catalog,
  onChange,
  onFlash,
}: {
  closet: ClosetItem[];
  holdings: PortfolioHolding[];
  catalog: CatalogRow[];
  onChange: (next: ClosetItem[]) => void;
  onFlash: (message: string) => void;
}) {
  const [tab, setTab] = useState<AddTab>("picks");
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [size, setSize] = useState("10");
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customKind, setCustomKind] = useState<ClosetItemKind>("top");
  const [customSize, setCustomSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterKind, setFilterKind] = useState<ClosetItemKind | "all">("all");
  const [closetQuery, setClosetQuery] = useState("");
  const [picksFilter, setPicksFilter] = useState<ClosetItemKind | "all">("all");

  const starterPicks = useMemo(() => getStarterClosetItems(), []);

  const { hits: liveHits, busy: searchBusy } = useCatalogSearch(
    query,
    tab === "catalog",
  );

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length >= 2) {
      return liveHits.map((row) => ({
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        ticker: row.ticker,
        styleCode: row.styleCode,
        fallbackImage: row.fallbackImage,
      }));
    }
    if (!q) return catalog.slice(0, 8);
    return catalog
      .filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.brand.toLowerCase().includes(q) ||
          row.styleCode.toLowerCase().includes(q) ||
          row.ticker.toLowerCase().includes(q) ||
          row.slug.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [catalog, query, liveHits]);

  const visible = useMemo(() => {
    const q = closetQuery.trim().toLowerCase();
    return closet.filter((item) => {
      if (filterKind !== "all" && item.kind !== filterKind) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.styleCode?.toLowerCase().includes(q) ?? false) ||
        (item.slug?.toLowerCase().includes(q) ?? false) ||
        CLOSET_KIND_LABELS[item.kind].toLowerCase().includes(q)
      );
    });
  }, [closet, filterKind, closetQuery]);

  function resolveCatalogRow(slug: string): CatalogRow | undefined {
    return (
      searchHits.find((c) => c.slug === slug) ||
      catalog.find((c) => c.slug === slug) ||
      liveHits.find((c) => c.slug === slug)
    );
  }

  function addFromCatalog() {
    const row = resolveCatalogRow(selectedSlug);
    if (!row) return;
    if (closet.some((c) => c.slug === row.slug && c.kind === "sneaker")) {
      onFlash("Already in your closet");
      return;
    }
    const item: ClosetItem = {
      id: newClosetItemId(),
      kind: "sneaker",
      name: row.name,
      brand: row.brand,
      image: row.fallbackImage,
      slug: row.slug,
      styleCode: row.styleCode,
      size: size.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    onChange([item, ...closet]);
    onFlash(`Added ${row.name}`);
    setQuery("");
    setSelectedSlug("");
  }

  async function addCustom(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const fileInput = form.elements.namedItem("photo") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      onFlash("Add a photo of the piece");
      return;
    }
    if (!customName.trim()) {
      onFlash("Give it a name");
      return;
    }
    setBusy(true);
    const result = await fileToClosetDataUrl(file);
    setBusy(false);
    if (!result.ok) {
      onFlash(result.error);
      return;
    }
    const item: ClosetItem = {
      id: newClosetItemId(),
      kind: customKind,
      name: customName.trim(),
      brand: customBrand.trim() || "—",
      image: result.dataUrl,
      size: customSize.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    onChange([item, ...closet]);
    onFlash(`Added ${item.name}`);
    setCustomName("");
    setCustomBrand("");
    setCustomSize("");
    form.reset();
  }

  function importHolding(holding: PortfolioHolding) {
    if (closet.some((c) => c.holdingId === holding.id || c.slug === holding.slug)) {
      onFlash("Already in your closet");
      return;
    }
    const item: ClosetItem = {
      id: newClosetItemId(),
      kind: "sneaker",
      name: holding.name,
      brand: holding.brand,
      image: holding.image,
      slug: holding.slug,
      styleCode: holding.styleCode,
      size: holding.size,
      holdingId: holding.id,
      addedAt: new Date().toISOString(),
    };
    onChange([item, ...closet]);
    onFlash(`Imported ${holding.name}`);
  }

  function importAllHoldings() {
    const existing = new Set(
      closet.flatMap((c) => [c.holdingId, c.slug].filter(Boolean) as string[]),
    );
    const additions: ClosetItem[] = [];
    for (const holding of holdings) {
      if (existing.has(holding.id) || existing.has(holding.slug)) continue;
      additions.push({
        id: newClosetItemId(),
        kind: "sneaker",
        name: holding.name,
        brand: holding.brand,
        image: holding.image,
        slug: holding.slug,
        styleCode: holding.styleCode,
        size: holding.size,
        holdingId: holding.id,
        addedAt: new Date().toISOString(),
      });
      existing.add(holding.id);
      existing.add(holding.slug);
    }
    if (!additions.length) {
      onFlash("Nothing new to import from Portfolio");
      return;
    }
    onChange([...additions, ...closet]);
    onFlash(`Imported ${additions.length} from Portfolio`);
  }

  function alreadyInCloset(pick: StarterClosetRow) {
    if (pick.slug) {
      return closet.some((c) => c.slug === pick.slug && c.kind === pick.kind);
    }
    return closet.some(
      (c) =>
        c.kind === pick.kind &&
        c.name.toLowerCase() === pick.name.toLowerCase() &&
        c.brand.toLowerCase() === pick.brand.toLowerCase(),
    );
  }

  function addStarterPick(pick: StarterClosetRow) {
    if (alreadyInCloset(pick)) {
      onFlash("Already in your closet");
      return;
    }
    const item: ClosetItem = {
      id: newClosetItemId(),
      kind: pick.kind,
      name: pick.name,
      brand: pick.brand,
      image: pick.image,
      slug: pick.slug,
      styleCode: pick.styleCode !== "—" ? pick.styleCode : undefined,
      notes: pick.notes,
      size: pick.kind === "sneaker" ? size.trim() || undefined : undefined,
      addedAt: new Date().toISOString(),
    };
    onChange([item, ...closet]);
    onFlash(`Added ${pick.name}`);
  }

  function addAllVisiblePicks() {
    const pool =
      picksFilter === "all"
        ? starterPicks
        : starterPicks.filter((p) => p.kind === picksFilter);
    const additions: ClosetItem[] = [];
    for (const pick of pool) {
      if (alreadyInCloset(pick)) continue;
      if (additions.some((a) => a.slug && a.slug === pick.slug)) continue;
      additions.push({
        id: newClosetItemId(),
        kind: pick.kind,
        name: pick.name,
        brand: pick.brand,
        image: pick.image,
        slug: pick.slug,
        styleCode: pick.styleCode !== "—" ? pick.styleCode : undefined,
        notes: pick.notes,
        size: pick.kind === "sneaker" ? size.trim() || undefined : undefined,
        addedAt: new Date().toISOString(),
      });
    }
    if (!additions.length) {
      onFlash("Those picks are already in your closet");
      return;
    }
    onChange([...additions, ...closet]);
    onFlash(`Added ${additions.length} starter picks`);
  }

  function removeItem(id: string) {
    onChange(closet.filter((item) => item.id !== id));
  }

  const visiblePicks = useMemo(() => {
    if (picksFilter === "all") return starterPicks;
    return starterPicks.filter((p) => p.kind === picksFilter);
  }, [starterPicks, picksFilter]);

  return (
    <div className="space-y-6">
      <section className="dash-card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-dash-border px-4 py-3 sm:px-5">
          {(
            [
              ["picks", "Starter picks"],
              ["catalog", "From board"],
              ["custom", "Upload piece"],
              ["portfolio", "From Portfolio"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === id
                  ? "bg-dash-accent text-dash-bg"
                  : "text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {tab === "picks" ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="max-w-xl text-sm text-dash-muted">
                  Curated sneakers from the SPI board plus a few apparel
                  placeholders so Fits has pieces to arrange. Send more names /
                  style IDs anytime and we’ll add them here.
                </p>
                <button
                  type="button"
                  onClick={addAllVisiblePicks}
                  className="rounded-xl border border-dash-border px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text"
                >
                  Add all shown
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPicksFilter("all")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    picksFilter === "all"
                      ? "bg-dash-elevated text-dash-text"
                      : "text-dash-faint hover:text-dash-muted"
                  }`}
                >
                  All
                </button>
                {CLOSET_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setPicksFilter(kind)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      picksFilter === kind
                        ? "bg-dash-elevated text-dash-text"
                        : "text-dash-faint hover:text-dash-muted"
                    }`}
                  >
                    {CLOSET_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>
              {visiblePicks.some((p) => p.kind === "sneaker") ? (
                <label className="block max-w-[8rem] text-xs text-dash-faint">
                  Default size (sneakers)
                  <input
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm outline-none focus:border-dash-accent"
                  />
                </label>
              ) : null}
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePicks.map((pick) => {
                  const owned = alreadyInCloset(pick);
                  return (
                    <li
                      key={pick.id}
                      className="flex gap-3 rounded-xl border border-dash-border bg-dash-elevated/40 p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
                        <ClosetImage src={pick.image} alt={pick.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-dash-text">
                          {pick.name}
                        </p>
                        <p className="truncate text-xs text-dash-faint">
                          {CLOSET_KIND_LABELS[pick.kind]} · {pick.brand}
                          {pick.styleCode && pick.styleCode !== "—"
                            ? ` · ${pick.styleCode}`
                            : ""}
                        </p>
                        <button
                          type="button"
                          disabled={owned}
                          onClick={() => addStarterPick(pick)}
                          className="mt-2 rounded-lg bg-dash-accent px-2.5 py-1 text-xs font-semibold text-dash-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {owned ? "In closet" : "Add"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {tab === "catalog" ? (
            <>
              <p className="text-sm text-dash-muted">
                Type a name, SKU, or brand — we search StockX beyond the top
                board.
              </p>
              <label className="block text-xs text-dash-faint">
                Search sneakers
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedSlug("");
                  }}
                  placeholder="Jordan 1 Mocha, Dunk Low…"
                  className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                />
              </label>
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                {searchBusy && query.trim().length >= 2 ? (
                  <p className="col-span-full px-1 py-3 text-sm text-dash-faint">
                    Searching…
                  </p>
                ) : null}
                {!searchBusy &&
                query.trim().length >= 2 &&
                searchHits.length === 0 ? (
                  <p className="col-span-full px-1 py-3 text-sm text-dash-faint">
                    No matches for “{query.trim()}”. Try another name or SKU.
                  </p>
                ) : null}
                {searchHits.map((row) => {
                  const active = selectedSlug === row.slug;
                  return (
                    <button
                      key={row.slug}
                      type="button"
                      onClick={() => setSelectedSlug(row.slug)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                        active
                          ? "border-dash-accent bg-dash-accent/10"
                          : "border-dash-border hover:bg-dash-elevated"
                      }`}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-dash-elevated">
                        <ClosetImage src={row.fallbackImage} alt="" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-dash-text">
                          {row.name}
                        </span>
                        <span className="block truncate text-xs text-dash-faint">
                          {row.brand} · {row.ticker}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs text-dash-faint">
                  Size
                  <input
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="mt-1 block w-24 rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none focus:border-dash-accent"
                  />
                </label>
                <button
                  type="button"
                  disabled={!selectedSlug}
                  onClick={addFromCatalog}
                  className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-40"
                >
                  Add to closet
                </button>
              </div>
            </>
          ) : null}

          {tab === "custom" ? (
            <form onSubmit={addCustom} className="space-y-3">
              <p className="text-sm text-dash-muted">
                Tees, shorts, jackets — upload a PNG/JPG like you would in
                Freeform. Saves with your account.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-dash-faint">
                  Name
                  <input
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Knicks locker room tee"
                    className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                  />
                </label>
                <label className="text-xs text-dash-faint">
                  Brand
                  <input
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Eric Emanuel"
                    className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                  />
                </label>
                <label className="text-xs text-dash-faint">
                  Type
                  <select
                    value={customKind}
                    onChange={(e) =>
                      setCustomKind(e.target.value as ClosetItemKind)
                    }
                    className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                  >
                    {CLOSET_KINDS.filter((k) => k !== "sneaker").map((kind) => (
                      <option key={kind} value={kind}>
                        {CLOSET_KIND_LABELS[kind]}
                      </option>
                    ))}
                    <option value="sneaker">Sneakers (custom)</option>
                  </select>
                </label>
                <label className="text-xs text-dash-faint">
                  Size <span className="text-dash-faint/70">(optional)</span>
                  <input
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                  />
                </label>
              </div>
              <label className="block text-xs text-dash-faint">
                Photo
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  required
                  className="mt-1.5 block w-full text-sm text-dash-muted file:mr-3 file:rounded-lg file:border-0 file:bg-dash-elevated file:px-3 file:py-2 file:text-sm file:font-medium file:text-dash-text"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "Adding…" : "Add custom piece"}
              </button>
            </form>
          ) : null}

          {tab === "portfolio" ? (
            <div className="space-y-3">
              <p className="text-sm text-dash-muted">
                Bring pairs you already track in{" "}
                <Link href="/portfolio" className="text-dash-accent hover:underline">
                  Portfolio
                </Link>{" "}
                into the closet for Fits.
              </p>
              {holdings.length ? (
                <>
                  <button
                    type="button"
                    onClick={importAllHoldings}
                    className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-text hover:bg-dash-elevated"
                  >
                    Import all ({holdings.length})
                  </button>
                  <ul className="divide-y divide-dash-border rounded-xl border border-dash-border">
                    {holdings.map((holding) => (
                      <li
                        key={holding.id}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-dash-elevated">
                          <ClosetImage src={holding.image} alt="" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {holding.name}
                          </span>
                          <span className="text-xs text-dash-faint">
                            Size {holding.size}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => importHolding(holding)}
                          className="rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-semibold hover:bg-dash-elevated"
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-dash-faint">
                  No portfolio holdings yet — add pairs under Portfolio first.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
              Your closet
            </h2>
            <p className="text-sm text-dash-muted">
              {closet.length} piece{closet.length === 1 ? "" : "s"} in your closet
            </p>
          </div>
          <label className="sr-only" htmlFor="closet-filter">
            Filter closet
          </label>
          <input
            id="closet-filter"
            value={closetQuery}
            onChange={(e) => setClosetQuery(e.target.value)}
            placeholder="Find in closet…"
            className="w-full max-w-xs rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none focus:border-dash-accent sm:w-56"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterKind("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                filterKind === "all"
                  ? "bg-dash-elevated text-dash-text"
                  : "text-dash-faint hover:text-dash-muted"
              }`}
            >
              All
            </button>
            {CLOSET_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFilterKind(kind)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  filterKind === kind
                    ? "bg-dash-elevated text-dash-text"
                    : "text-dash-faint hover:text-dash-muted"
                }`}
              >
                {CLOSET_KIND_LABELS[kind]}
              </button>
            ))}
        </div>

        {visible.length === 0 ? (
          <div className="dash-card px-5 py-10 text-center text-sm text-dash-muted">
            Empty closet — add sneakers from the board or upload a tee/shorts
            PNG to start building fits.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <li
                key={item.id}
                className="dash-card flex flex-col overflow-hidden"
              >
                <div className="relative aspect-square bg-dash-elevated/50 p-4">
                  <ClosetImage src={item.image} alt={item.name} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="font-[family-name:var(--font-plex-mono)] text-[10px] uppercase tracking-[0.14em] text-dash-faint">
                    {CLOSET_KIND_LABELS[item.kind]}
                    {item.size ? ` · ${item.size}` : ""}
                  </p>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">
                    {item.name}
                  </p>
                  <p className="text-xs text-dash-faint">{item.brand}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-auto self-start text-xs text-dash-down hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

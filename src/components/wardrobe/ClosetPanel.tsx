"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ClosetImage } from "@/components/wardrobe/ClosetImage";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { fileToClosetDataUrl } from "@/lib/wardrobe/image";
import {
  getOutfitIdeas,
  outfitPiecesWithSneaker,
  type OutfitIdea,
  type OutfitIdeaPiece,
} from "@/lib/wardrobe/outfitIdeas";
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

type AddTab = "outfits" | "catalog" | "custom" | "portfolio";

export function ClosetPanel({
  closet,
  holdings,
  catalog,
  onChange,
  onFlash,
  onSaveOutfit,
}: {
  closet: ClosetItem[];
  holdings: PortfolioHolding[];
  catalog: CatalogRow[];
  onChange: (next: ClosetItem[]) => void;
  onFlash: (message: string) => void;
  /** Optional: also create a Fit board from the outfit pieces. */
  onSaveOutfit?: (input: { name: string; items: ClosetItem[] }) => void;
}) {
  const [tab, setTab] = useState<AddTab>("outfits");
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

  const outfitIdeas = useMemo(() => getOutfitIdeas(), []);

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

  function pieceNotes(piece: OutfitIdeaPiece) {
    return [piece.colorway, piece.notes].filter(Boolean).join(" · ") || undefined;
  }

  /** Match by slug when present; otherwise name + size + colorway/notes. */
  function matchesClosetPiece(c: ClosetItem, piece: OutfitIdeaPiece) {
    if (piece.slug) return c.slug === piece.slug && c.kind === piece.kind;
    const notes = pieceNotes(piece);
    return (
      c.kind === piece.kind &&
      c.name.toLowerCase() === piece.name.toLowerCase() &&
      (c.size ?? "") === (piece.size ?? "") &&
      (c.notes ?? "") === (notes ?? "")
    );
  }

  function alreadyInCloset(piece: OutfitIdeaPiece) {
    return closet.some((c) => matchesClosetPiece(c, piece));
  }

  function pieceToClosetItem(piece: OutfitIdeaPiece): ClosetItem {
    return {
      id: newClosetItemId(),
      kind: piece.kind,
      name: piece.name,
      brand: piece.brand,
      image: piece.image,
      slug: piece.slug,
      styleCode: piece.styleCode,
      size: piece.size,
      notes: pieceNotes(piece),
      addedAt: new Date().toISOString(),
    };
  }

  function findOrCreatePiece(
    piece: OutfitIdeaPiece,
    working: ClosetItem[],
  ): { item: ClosetItem; working: ClosetItem[]; created: boolean } {
    const existing = working.find((c) => matchesClosetPiece(c, piece));
    if (existing) return { item: existing, working, created: false };
    const item = pieceToClosetItem(piece);
    return { item, working: [item, ...working], created: true };
  }

  function addOutfitPiece(piece: OutfitIdeaPiece) {
    if (alreadyInCloset(piece)) {
      onFlash("Already in your closet");
      return;
    }
    const item = pieceToClosetItem(piece);
    onChange([item, ...closet]);
    onFlash(`Added ${piece.name}`);
  }

  function addOutfitIdea(outfit: OutfitIdea, sneaker?: OutfitIdeaPiece) {
    const primarySneaker =
      sneaker ?? outfit.pieces.find((p) => p.kind === "sneaker");
    const buildPieces =
      primarySneaker != null
        ? outfitPiecesWithSneaker(outfit, primarySneaker)
        : outfit.pieces;

    let working = [...closet];
    const fitItems: ClosetItem[] = [];
    let added = 0;
    for (const piece of buildPieces) {
      const result = findOrCreatePiece(piece, working);
      working = result.working;
      fitItems.push(result.item);
      if (result.created) added += 1;
    }
    onChange(working);
    const fitName =
      sneaker && sneaker.id !== outfit.pieces.find((p) => p.kind === "sneaker")?.id
        ? `${outfit.name.replace(/\s*×.*$/, "")} × ${sneaker.name.replace(/^Vans\s+/i, "")}`
        : outfit.name;
    onSaveOutfit?.({ name: fitName, items: fitItems });
    onFlash(
      added
        ? `Added ${fitName} (${added} new · Fit ready)`
        : `${fitName} pieces already in closet — Fit ready`,
    );
  }

  function removeItem(id: string) {
    onChange(closet.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="dash-card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-dash-border px-4 py-3 sm:px-5">
          {(
            [
              ["outfits", "Outfit ideas"],
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
          {tab === "outfits" ? (
            <>
              <p className="max-w-2xl text-sm text-dash-muted">
                Real outfit ideas — tee, shorts, sneakers with sizes. Some fits
                include <span className="text-dash-text">sneaker inspo</span>{" "}
                so you can try alternate pairs. Tap{" "}
                <span className="text-dash-text">Add outfit</span> to drop
                pieces in your closet and open a Fit board.
              </p>
              <ul className="space-y-5">
                {outfitIdeas.map((outfit) => (
                  <li
                    key={outfit.id}
                    className="rounded-2xl border border-dash-border bg-dash-elevated/30 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 max-w-xl">
                        <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-dash-text">
                          {outfit.name}
                        </h3>
                        {outfit.blurb ? (
                          <p className="mt-1 text-sm text-dash-muted">
                            {outfit.blurb}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOutfitIdea(outfit)}
                        className="rounded-xl bg-dash-accent px-3 py-2 text-sm font-semibold text-dash-bg hover:brightness-110"
                      >
                        Add outfit
                      </button>
                    </div>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                      {outfit.pieces.map((piece) => {
                        const owned = alreadyInCloset(piece);
                        return (
                          <li
                            key={piece.id}
                            className="flex gap-3 rounded-xl border border-dash-border bg-dash-bg/60 p-3"
                          >
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-elevated">
                              <ClosetImage src={piece.image} alt={piece.name} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-dash-faint">
                                {CLOSET_KIND_LABELS[piece.kind]}
                                {piece.size ? ` · ${piece.size}` : ""}
                                {piece.kind === "sneaker" ? " · pick" : ""}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-dash-text">
                                {piece.name}
                              </p>
                              <p className="truncate text-xs text-dash-faint">
                                {piece.brand}
                                {piece.colorway ? ` · ${piece.colorway}` : ""}
                                {piece.styleCode ? ` · ${piece.styleCode}` : ""}
                              </p>
                              {piece.why ? (
                                <p className="mt-1 line-clamp-2 text-xs text-dash-muted">
                                  {piece.why}
                                </p>
                              ) : null}
                              <button
                                type="button"
                                disabled={owned}
                                onClick={() => addOutfitPiece(piece)}
                                className="mt-2 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {owned ? "In closet" : "Add piece"}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {outfit.sneakerInspo?.length ? (
                      <div className="mt-4 border-t border-dash-border pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dash-faint">
                          Sneaker inspo — swap the pair
                        </p>
                        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                          {outfit.sneakerInspo.map((sneaker) => {
                            const owned = alreadyInCloset(sneaker);
                            return (
                              <li
                                key={sneaker.id}
                                className="flex gap-3 rounded-xl border border-dashed border-dash-border bg-dash-bg/40 p-3"
                              >
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-dash-border bg-dash-elevated">
                                  <ClosetImage
                                    src={sneaker.image}
                                    alt={sneaker.name}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] uppercase tracking-[0.12em] text-dash-faint">
                                    Alt · {sneaker.size || "—"}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-dash-text">
                                    {sneaker.name}
                                  </p>
                                  {sneaker.why ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-dash-muted">
                                      {sneaker.why}
                                    </p>
                                  ) : null}
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addOutfitIdea(outfit, sneaker)
                                      }
                                      className="rounded-lg bg-dash-accent/15 px-2.5 py-1 text-xs font-medium text-dash-accent hover:bg-dash-accent/25"
                                    >
                                      Build fit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={owned}
                                      onClick={() => addOutfitPiece(sneaker)}
                                      className="rounded-lg border border-dash-border px-2.5 py-1 text-xs font-medium text-dash-muted hover:bg-dash-elevated hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {owned ? "In closet" : "Add piece"}
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
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
            Empty closet — open Outfit ideas for curated looks, pull from the
            board, or upload a tee/shorts PNG to start building fits.
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

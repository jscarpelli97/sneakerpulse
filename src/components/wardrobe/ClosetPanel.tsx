"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ClosetImage } from "@/components/wardrobe/ClosetImage";
import { fileToClosetDataUrl } from "@/lib/wardrobe/image";
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
  const [tab, setTab] = useState<"catalog" | "custom" | "portfolio">("catalog");
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [size, setSize] = useState("10");
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customKind, setCustomKind] = useState<ClosetItemKind>("top");
  const [customSize, setCustomSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterKind, setFilterKind] = useState<ClosetItemKind | "all">("all");

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
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
  }, [catalog, query]);

  const visible = useMemo(() => {
    if (filterKind === "all") return closet;
    return closet.filter((item) => item.kind === filterKind);
  }, [closet, filterKind]);

  function addFromCatalog() {
    const row = catalog.find((c) => c.slug === selectedSlug);
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

  function removeItem(id: string) {
    onChange(closet.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="dash-card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-dash-border px-4 py-3 sm:px-5">
          {(
            [
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
          {tab === "catalog" ? (
            <>
              <p className="text-sm text-dash-muted">
                Pull StockX product shots from the SPI board into your closet.
              </p>
              <label className="block text-xs text-dash-faint">
                Search sneakers
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Jordan, Dunk, Yeezy…"
                  className="mt-1.5 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
                />
              </label>
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
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
                Freeform. Stored on this device only.
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
              {closet.length} piece{closet.length === 1 ? "" : "s"} on this device
            </p>
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

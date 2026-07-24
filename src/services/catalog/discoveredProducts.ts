/**
 * Local catalog of pairs discovered via search / market loads.
 * Prefer this (+ offline JSON) before spending KicksDB quota again.
 */
import { databaseConfigured, query } from "@/lib/db";
import type { OfflineCatalogQuote } from "@/services/catalog/offlineCatalog";
import type { SneakerCatalogEntry } from "@/types/catalog";

export type DiscoveredSource = "search" | "market" | "remember";

export type DiscoveredProductInput = {
  slug: string;
  ticker?: string | null;
  styleCode?: string | null;
  name: string;
  brand?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  colorway?: string | null;
  retail?: number | null;
  stockxUrl?: string | null;
  fallbackImage?: string | null;
  featured?: boolean | null;
  rank?: number | null;
  price?: number | null;
  weeklyOrders?: number | null;
  source?: DiscoveredSource;
};

type DiscoveredRow = {
  slug: string;
  ticker: string;
  style_code: string;
  name: string;
  brand: string;
  year: number | null;
  release_date: string | null;
  colorway: string | null;
  retail: string | number;
  stockx_url: string;
  fallback_image: string;
  featured: boolean;
  rank: number | null;
  price: string | number | null;
  weekly_orders: number | null;
  source: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __spiDiscoveredMem: Map<string, OfflineCatalogQuote> | undefined;
}

function memoryStore() {
  if (!globalThis.__spiDiscoveredMem) {
    globalThis.__spiDiscoveredMem = new Map();
  }
  return globalThis.__spiDiscoveredMem;
}

function num(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToQuote(row: DiscoveredRow): OfflineCatalogQuote {
  const year = row.year ?? new Date().getUTCFullYear();
  return {
    slug: row.slug,
    ticker: row.ticker || "—",
    styleCode: row.style_code || "—",
    name: row.name,
    brand: row.brand || "Unknown",
    year,
    releaseDate: row.release_date || `${year}-01-01`,
    colorway: row.colorway || "—",
    retail: num(row.retail) ?? 0,
    stockxUrl: row.stockx_url || `https://stockx.com/${row.slug}`,
    fallbackImage: row.fallback_image || "",
    featured: Boolean(row.featured),
    rank: row.rank,
    price: num(row.price),
    weeklyOrders: row.weekly_orders,
    live: false,
  };
}

function inputToQuote(input: DiscoveredProductInput): OfflineCatalogQuote {
  const year = input.year ?? new Date().getUTCFullYear();
  return {
    slug: input.slug,
    ticker: input.ticker?.trim() || "—",
    styleCode: input.styleCode?.trim() || "—",
    name: input.name.trim(),
    brand: input.brand?.trim() || "Unknown",
    year,
    releaseDate: input.releaseDate || `${year}-01-01`,
    colorway: input.colorway || "—",
    retail: input.retail ?? 0,
    stockxUrl: input.stockxUrl || `https://stockx.com/${input.slug}`,
    fallbackImage: input.fallbackImage || "",
    featured: Boolean(input.featured),
    rank: input.rank ?? null,
    price: input.price ?? null,
    weeklyOrders: input.weeklyOrders ?? null,
    live: false,
  };
}

export function quoteToCatalogEntry(
  quote: OfflineCatalogQuote,
): SneakerCatalogEntry {
  return {
    slug: quote.slug,
    ticker: quote.ticker,
    styleCode: quote.styleCode,
    name: quote.name,
    brand: quote.brand,
    year: quote.year,
    releaseDate: quote.releaseDate,
    colorway: quote.colorway,
    retail: quote.retail,
    stockxUrl: quote.stockxUrl,
    fallbackImage: quote.fallbackImage,
    featured: quote.featured,
    rank: quote.rank,
  };
}

export async function upsertDiscoveredProduct(
  input: DiscoveredProductInput,
): Promise<OfflineCatalogQuote | null> {
  const slug = input.slug?.trim();
  const name = input.name?.trim();
  if (!slug || !name) return null;

  const quote = inputToQuote({ ...input, slug, name });
  memoryStore().set(slug, quote);

  if (!databaseConfigured()) return quote;

  try {
    await query(
      `INSERT INTO discovered_products (
        slug, ticker, style_code, name, brand, year, release_date, colorway,
        retail, stockx_url, fallback_image, featured, rank, price, weekly_orders,
        source, captured_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,
        $16, now(), now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        ticker = EXCLUDED.ticker,
        style_code = EXCLUDED.style_code,
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        year = COALESCE(EXCLUDED.year, discovered_products.year),
        release_date = COALESCE(EXCLUDED.release_date, discovered_products.release_date),
        colorway = COALESCE(EXCLUDED.colorway, discovered_products.colorway),
        retail = CASE
          WHEN EXCLUDED.retail > 0 THEN EXCLUDED.retail
          ELSE discovered_products.retail
        END,
        stockx_url = EXCLUDED.stockx_url,
        fallback_image = CASE
          WHEN EXCLUDED.fallback_image <> '' THEN EXCLUDED.fallback_image
          ELSE discovered_products.fallback_image
        END,
        featured = EXCLUDED.featured OR discovered_products.featured,
        rank = COALESCE(EXCLUDED.rank, discovered_products.rank),
        price = COALESCE(EXCLUDED.price, discovered_products.price),
        weekly_orders = COALESCE(EXCLUDED.weekly_orders, discovered_products.weekly_orders),
        source = EXCLUDED.source,
        updated_at = now()`,
      [
        quote.slug,
        quote.ticker,
        quote.styleCode,
        quote.name,
        quote.brand,
        quote.year,
        quote.releaseDate,
        quote.colorway,
        quote.retail,
        quote.stockxUrl,
        quote.fallbackImage,
        quote.featured ?? false,
        quote.rank,
        quote.price,
        quote.weeklyOrders,
        input.source ?? "search",
      ],
    );
  } catch {
    // Table may not be migrated yet — memory still holds the pair for this process.
  }

  return quote;
}

export async function getDiscoveredBySlug(
  slug: string,
): Promise<OfflineCatalogQuote | null> {
  const key = slug.trim();
  if (!key) return null;

  const mem = memoryStore().get(key);
  if (mem) return mem;

  if (!databaseConfigured()) return null;

  try {
    const { rows } = await query<DiscoveredRow>(
      `SELECT * FROM discovered_products WHERE slug = $1 LIMIT 1`,
      [key],
    );
    const row = rows[0];
    if (!row) return null;
    const quote = rowToQuote(row);
    memoryStore().set(key, quote);
    return quote;
  } catch {
    return null;
  }
}

export async function searchDiscovered(
  queryText: string,
  limit = 16,
): Promise<OfflineCatalogQuote[]> {
  const tokens = queryText
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const matchesLocal = (quote: OfflineCatalogQuote) => {
    const hay = [
      quote.name,
      quote.brand,
      quote.styleCode,
      quote.ticker,
      quote.slug,
      quote.colorway,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => hay.includes(token));
  };

  if (!databaseConfigured()) {
    return [...memoryStore().values()].filter(matchesLocal).slice(0, limit);
  }

  try {
    const { rows } = await query<DiscoveredRow>(
      `SELECT * FROM discovered_products
       ORDER BY updated_at DESC
       LIMIT 500`,
    );
    return rows
      .map(rowToQuote)
      .filter(matchesLocal)
      .slice(0, limit);
  } catch {
    return [...memoryStore().values()].filter(matchesLocal).slice(0, limit);
  }
}

/** Fire-and-forget persist — never blocks the request path. */
export function rememberProductLater(input: DiscoveredProductInput) {
  void upsertDiscoveredProduct(input).catch(() => {
    /* ignore */
  });
}

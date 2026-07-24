import offlineFile from "@/data/catalog/top-sellers.json";
import type { SneakerCatalogEntry } from "@/types/catalog";

type OfflineProduct = SneakerCatalogEntry & {
  price: number | null;
  weeklyOrders: number | null;
  live?: boolean;
  capturedAt?: string;
};

export type OfflineCatalogQuote = SneakerCatalogEntry & {
  price: number | null;
  rank: number | null;
  weeklyOrders: number | null;
  live: boolean;
};

type OfflineCatalogFile = {
  asOf?: string;
  updatedAt?: string;
  count?: number;
  products?: OfflineProduct[];
};

const file = offlineFile as OfflineCatalogFile;

export function getOfflineCatalogAsOf() {
  return file.asOf ?? file.updatedAt?.slice(0, 10) ?? null;
}

export function getOfflineCatalogEntries(
  limit = Number.POSITIVE_INFINITY,
): SneakerCatalogEntry[] {
  const products = file.products ?? [];
  return products.slice(0, limit).map((product) => ({
    slug: product.slug,
    ticker: product.ticker,
    styleCode: product.styleCode,
    name: product.name,
    brand: product.brand,
    year: product.year,
    releaseDate: product.releaseDate,
    colorway: product.colorway,
    retail: product.retail,
    stockxUrl: product.stockxUrl,
    fallbackImage: product.fallbackImage,
    featured: product.featured,
    rank: product.rank ?? null,
  }));
}

export function getOfflineCatalogQuotes(
  limit = Number.POSITIVE_INFINITY,
): OfflineCatalogQuote[] {
  const products = file.products ?? [];
  return products.slice(0, limit).map((product) => ({
    slug: product.slug,
    ticker: product.ticker,
    styleCode: product.styleCode,
    name: product.name,
    brand: product.brand,
    year: product.year,
    releaseDate: product.releaseDate,
    colorway: product.colorway,
    retail: product.retail,
    stockxUrl: product.stockxUrl,
    fallbackImage: product.fallbackImage,
    featured: product.featured,
    rank: product.rank ?? null,
    price: product.price ?? null,
    weeklyOrders: product.weeklyOrders ?? null,
    live: false,
  }));
}

export function getOfflineQuoteBySlug(slug: string): OfflineCatalogQuote | null {
  return getOfflineCatalogQuotes().find((row) => row.slug === slug) ?? null;
}

/**
 * Offline JSON first, then pairs previously discovered via search/market
 * (Neon / process memory). Use this before spending KicksDB quota.
 */
export async function resolveCatalogQuoteBySlug(
  slug: string,
): Promise<OfflineCatalogQuote | null> {
  const offline = getOfflineQuoteBySlug(slug);
  if (offline) return offline;
  const { getDiscoveredBySlug } = await import(
    "@/services/catalog/discoveredProducts"
  );
  return getDiscoveredBySlug(slug);
}

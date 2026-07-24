import {
  getOfflineCatalogEntries,
  getOfflineCatalogQuotes,
  getOfflineQuoteBySlug,
  resolveCatalogQuoteBySlug,
} from "@/services/catalog/offlineCatalog";
import {
  mapListedProductToCatalog,
  TOP_SELLERS_LIMIT,
  HOMEPAGE_WATCHLIST_LIMIT,
  STATIC_PARAMS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import {
  fetchStockxProduct,
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { kicksLiveReadsEnabled } from "@/lib/dataMode";
import {
  quoteToCatalogEntry,
  rememberProductLater,
} from "@/services/catalog/discoveredProducts";
import type { SneakerCatalogEntry } from "@/types/catalog";

export type { SneakerCatalogEntry };
export { TOP_SELLERS_LIMIT, HOMEPAGE_WATCHLIST_LIMIT, STATIC_PARAMS_LIMIT };

/**
 * Offline / no-key / inactive-key fallback.
 * Free mode serves the committed catalog under src/data/catalog/top-sellers.json.
 */
export const FALLBACK_SNEAKERS: SneakerCatalogEntry[] =
  getOfflineCatalogEntries(TOP_SELLERS_LIMIT);

/** @deprecated Prefer getTrackedCatalog() — kept for offline fallbacks. */
export const SNEAKERS = FALLBACK_SNEAKERS;

/**
 * Live catalog: current top StockX sneakers by sales rank.
 * Falls back to the free offline catalog when the key is missing, inactive,
 * or live page reads are disabled (default).
 */
export async function getTrackedCatalog(
  limit = TOP_SELLERS_LIMIT,
): Promise<SneakerCatalogEntry[]> {
  const apiKey = getKicksApiKey();
  if (!apiKey || !kicksLiveReadsEnabled()) {
    return getOfflineCatalogEntries(limit);
  }

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) {
    return getOfflineCatalogEntries(limit);
  }

  const mapped = res.data.data
    .map((product, index) =>
      mapListedProductToCatalog(product, {
        featured: (product.rank ?? index + 1) === 1,
      }),
    )
    .filter((entry): entry is SneakerCatalogEntry => entry != null)
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

  return mapped.length ? mapped : getOfflineCatalogEntries(limit);
}

export async function getAllSneakerSlugs() {
  const catalog = await getTrackedCatalog();
  return catalog.map((sneaker) => sneaker.slug);
}

export async function getFeaturedSneaker() {
  const catalog = await getTrackedCatalog();
  return catalog.find((sneaker) => sneaker.featured) ?? catalog[0];
}

export async function getSneakerBySlug(slug: string) {
  const catalog = await getTrackedCatalog();
  const hit = catalog.find((sneaker) => sneaker.slug === slug);
  if (hit) return hit;

  const resolved = await resolveCatalogQuoteBySlug(slug);
  if (resolved) return quoteToCatalogEntry(resolved);

  // Allow market pages for any StockX slug even if it falls out of the tracked top sellers.
  const apiKey = getKicksApiKey();
  if (!apiKey || !kicksLiveReadsEnabled()) return null;
  const res = await fetchStockxProduct(slug, apiKey);
  if (!res.ok) return null;
  const mapped = mapListedProductToCatalog(res.data.data);
  if (mapped) {
    rememberProductLater({
      ...mapped,
      price:
        typeof res.data.data.min_price === "number"
          ? res.data.data.min_price
          : null,
      weeklyOrders: res.data.data.weekly_orders ?? null,
      source: "market",
    });
  }
  return mapped;
}

export {
  getOfflineCatalogQuotes,
  getOfflineQuoteBySlug,
  resolveCatalogQuoteBySlug,
};

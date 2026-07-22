import {
  mapListedProductToCatalog,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import {
  fetchStockxProduct,
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import type { SneakerCatalogEntry } from "@/types/catalog";

export type { SneakerCatalogEntry };
export { TOP_SELLERS_LIMIT };

/**
 * Offline / no-key fallback. Live tracking uses StockX top sellers by rank.
 */
export const FALLBACK_SNEAKERS: SneakerCatalogEntry[] = [
  {
    slug: "air-jordan-1-retro-high-dark-mocha",
    ticker: "J1DMCH",
    styleCode: "555088-105",
    name: "Jordan 1 High Dark Mocha",
    brand: "Jordan",
    year: 2020,
    releaseDate: "2020-10-31",
    colorway: "Sail / Dark Mocha / Black",
    retail: 170,
    stockxUrl: "https://stockx.com/air-jordan-1-retro-high-dark-mocha",
    fallbackImage:
      "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Dark-Mocha-2-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
    featured: true,
    rank: null,
  },
];

/** @deprecated Prefer getTrackedCatalog() — kept for offline fallbacks. */
export const SNEAKERS = FALLBACK_SNEAKERS;

/**
 * Live catalog: current top StockX sneakers by sales rank.
 */
export async function getTrackedCatalog(
  limit = TOP_SELLERS_LIMIT,
): Promise<SneakerCatalogEntry[]> {
  const apiKey = getKicksApiKey();
  if (!apiKey) return FALLBACK_SNEAKERS;

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) {
    return FALLBACK_SNEAKERS;
  }

  const mapped = res.data.data
    .map((product, index) =>
      mapListedProductToCatalog(product, {
        featured: (product.rank ?? index + 1) === 1,
      }),
    )
    .filter((entry): entry is SneakerCatalogEntry => entry != null)
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

  return mapped.length ? mapped : FALLBACK_SNEAKERS;
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

  // Allow market pages for any StockX slug even if it falls out of the top 100.
  const apiKey = getKicksApiKey();
  if (!apiKey) return null;
  const res = await fetchStockxProduct(slug, apiKey);
  if (!res.ok) return null;
  return mapListedProductToCatalog(res.data.data);
}

import {
  getOfflineCatalogQuotes,
  getTrackedCatalog,
  type SneakerCatalogEntry,
} from "@/services/catalog/sneakers";
import {
  mapListedProductToCatalog,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/mapProductToCatalog";
import {
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";

export type CatalogQuote = SneakerCatalogEntry & {
  price: number | null;
  rank: number | null;
  weeklyOrders: number | null;
  live: boolean;
};

export async function getCatalogQuotes(
  limit = TOP_SELLERS_LIMIT,
): Promise<CatalogQuote[]> {
  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return getOfflineCatalogQuotes(limit);
  }

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) {
    return getOfflineCatalogQuotes(limit);
  }

  const quotes: CatalogQuote[] = [];
  for (const [index, product] of res.data.data.entries()) {
    const entry = mapListedProductToCatalog(product, {
      featured: (product.rank ?? index + 1) === 1,
    });
    if (!entry) continue;
    quotes.push({
      ...entry,
      price: product.min_price ?? product.avg_price ?? null,
      rank: product.rank ?? null,
      weeklyOrders: product.weekly_orders ?? null,
      live: true,
    });
  }

  if (!quotes.length) {
    return getOfflineCatalogQuotes(limit);
  }

  return quotes.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

/** @deprecated Prefer getOfflineCatalogQuotes via getCatalogQuotes fallback. */
export async function getCatalogQuotesFallback(limit = TOP_SELLERS_LIMIT) {
  const fallback = await getTrackedCatalog(limit);
  return fallback.map((sneaker) => ({
    ...sneaker,
    price: null,
    rank: sneaker.rank ?? null,
    weeklyOrders: null,
    live: false,
  }));
}

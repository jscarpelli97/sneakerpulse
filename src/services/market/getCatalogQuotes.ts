import {
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
    const fallback = await getTrackedCatalog(limit);
    return fallback.map((sneaker) => ({
      ...sneaker,
      price: null,
      rank: sneaker.rank ?? null,
      weeklyOrders: null,
      live: false,
    }));
  }

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) {
    const fallback = await getTrackedCatalog(limit);
    return fallback.map((sneaker) => ({
      ...sneaker,
      price: null,
      rank: sneaker.rank ?? null,
      weeklyOrders: null,
      live: false,
    }));
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

  return quotes.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

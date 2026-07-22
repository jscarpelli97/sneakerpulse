import {
  SNEAKERS,
  type SneakerCatalogEntry,
} from "@/catalog/sneakers";
import {
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";

export type CatalogQuote = SneakerCatalogEntry & {
  price: number | null;
  rank: number | null;
  weeklyOrders: number | null;
  live: boolean;
};

export async function getCatalogQuotes(): Promise<CatalogQuote[]> {
  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return SNEAKERS.map((sneaker) => ({
      ...sneaker,
      price: null,
      rank: null,
      weeklyOrders: null,
      live: false,
    }));
  }

  const results = await Promise.all(
    SNEAKERS.map(async (sneaker) => {
      const res = await fetchStockxProduct(sneaker.slug, apiKey);
      if (!res.ok) {
        return {
          ...sneaker,
          price: null,
          rank: null,
          weeklyOrders: null,
          live: false,
        };
      }
      const product = res.data.data;
      return {
        ...sneaker,
        price: product.min_price ?? product.avg_price ?? null,
        rank: product.rank ?? null,
        weeklyOrders: product.weekly_orders ?? null,
        live: true,
      };
    }),
  );

  return results;
}

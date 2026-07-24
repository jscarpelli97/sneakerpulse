import { fetchStockxProduct, getKicksApiKey } from "@/lib/kicksdb/client";
import { resolveCatalogQuoteBySlug } from "@/services/catalog/discoveredProducts";
import { mapProductToMarket } from "@/services/market/mapProductToMarket";
import type { SizeAsk } from "@/types/market";

export type LiveSizeLadder = {
  slug: string;
  sizes: SizeAsk[];
  marketPrice: number | null;
  statsLowestAsk: number | null;
  /** True when sizes came from a KicksDB product pull (fresh or short cache). */
  live: boolean;
};

/**
 * Live StockX size ladder for one slug.
 * Bypasses KICKSDB_LIVE_READS so the board can stay on the daily snapshot
 * while Deal / Portfolio still get per-size asks (1 product call / slug).
 */
export async function getLiveSizeLadder(slug: string): Promise<LiveSizeLadder> {
  const cleaned = slug.trim();
  const offline = cleaned ? await resolveCatalogQuoteBySlug(cleaned) : null;
  const empty: LiveSizeLadder = {
    slug: cleaned,
    sizes: [],
    marketPrice: offline?.price ?? null,
    statsLowestAsk: offline?.price ?? null,
    live: false,
  };
  if (!cleaned) return empty;

  const apiKey = getKicksApiKey();
  if (!apiKey) return empty;

  const catalogFallback = {
    slug: cleaned,
    ticker: offline?.ticker ?? cleaned.slice(0, 8).toUpperCase(),
    styleCode: offline?.styleCode ?? cleaned,
    name: offline?.name ?? cleaned,
    brand: offline?.brand ?? "Unknown",
    year: offline?.year ?? new Date().getUTCFullYear(),
    releaseDate:
      offline?.releaseDate ?? `${new Date().getUTCFullYear()}-01-01`,
    colorway: offline?.colorway ?? "—",
    retail: offline?.retail ?? 0,
    stockxUrl: offline?.stockxUrl ?? `https://stockx.com/${cleaned}`,
    fallbackImage: offline?.fallbackImage ?? "",
  };

  const productRes = await fetchStockxProduct(cleaned, apiKey);
  if (!productRes.ok || !productRes.data?.data) {
    return empty;
  }

  const product = productRes.data.data;
  const market = mapProductToMarket({
    product,
    catalog: catalogFallback,
    chartSeries: [],
    historySource: "bootstrap",
    upstreamStatus: productRes.cacheHit ? "cached" : "live",
  });

  return {
    slug: cleaned,
    sizes: market.sizes,
    marketPrice: market.price > 0 ? market.price : null,
    statsLowestAsk:
      market.stats.lowestAsk != null && market.stats.lowestAsk > 0
        ? market.stats.lowestAsk
        : null,
    live: !productRes.cacheHit || market.sizes.length > 0,
  };
}

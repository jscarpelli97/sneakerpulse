import { getSneakerBySlug } from "@/services/catalog/sneakers";
import type { SneakerCatalogEntry } from "@/types/catalog";
import {
  fetchStockxDailySales,
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { mapListedProductToCatalog } from "@/services/catalog/mapProductToCatalog";
import { resolveLocalHistory } from "@/services/market/historyStore";
import { emptyMarket, mapProductToMarket } from "@/lib/mapProductToMarket";
import { salesToSeries, upsertToday } from "@/utils/metrics";
import type {
  HistorySource,
  MarketLoadResult,
  UpstreamStatus,
} from "@/types/market";

export async function getMarketBySlug(slug: string): Promise<MarketLoadResult> {
  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      error:
        "Add a free KicksDB API key as KICKSDB_API_KEY to load live StockX data.",
    };
  }

  const productRes = await fetchStockxProduct(slug, apiKey);
  if (!productRes.ok) {
    if (productRes.status === 404) {
      return {
        ok: false,
        code: "not_found",
        error: `Sneaker "${slug}" was not found on StockX via KicksDB.`,
      };
    }
    return {
      ok: false,
      code: "upstream",
      error: `StockX data request failed (${productRes.status}). ${productRes.body.slice(0, 180)}`,
    };
  }

  const product = productRes.data.data;
  const catalogFromList = await getSneakerBySlug(slug);
  const catalog =
    catalogFromList ??
    mapListedProductToCatalog(product) ??
    ({
      slug,
      ticker: slug.slice(0, 8).toUpperCase(),
      styleCode: product.sku || slug,
      name: product.title || slug,
      brand: product.brand || "Unknown",
      year: new Date().getUTCFullYear(),
      releaseDate: `${new Date().getUTCFullYear()}-01-01`,
      colorway: "—",
      retail: 0,
      stockxUrl: `https://stockx.com/${slug}`,
      fallbackImage: product.image || "",
      rank: product.rank ?? null,
    } satisfies SneakerCatalogEntry);

  let upstreamStatus: UpstreamStatus = productRes.cacheHit
    ? "cached"
    : "live";

  const local = resolveLocalHistory(catalog.slug);
  let historySource: HistorySource = local.source;
  let chartSeries = local.series;

  const salesRes = await fetchStockxDailySales(product.id, apiKey);
  if (salesRes.ok && (salesRes.data.data?.length ?? 0) > 1) {
    chartSeries = salesToSeries(salesRes.data.data ?? []);
    historySource = "sales";
  } else if (!salesRes.ok && salesRes.status !== 403) {
    upstreamStatus = productRes.cacheHit ? "cached" : "degraded";
  }

  if (historySource !== "sales") {
    const livePrice =
      product.min_price ??
      product.avg_price ??
      chartSeries.at(-1)?.price ??
      0;
    if (livePrice > 0) {
      chartSeries = upsertToday(
        chartSeries,
        livePrice,
        product.weekly_orders ? Math.round(product.weekly_orders / 7) : 1,
      );
    }
  }

  return {
    ok: true,
    data: mapProductToMarket({
      product,
      catalog,
      chartSeries,
      historySource,
      upstreamStatus,
    }),
  };
}

export function getMarketFallback(catalog: SneakerCatalogEntry) {
  return emptyMarket(catalog);
}

import {
  getSneakerBySlug,
  type SneakerCatalogEntry,
} from "@/services/catalog/sneakers";
import {
  fetchStockxDailySales,
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { resolveLocalHistory } from "@/services/market/historyStore";
import { emptyMarket, mapProductToMarket } from "@/lib/mapProductToMarket";
import { salesToSeries, upsertToday } from "@/utils/metrics";
import type {
  HistorySource,
  MarketLoadResult,
  UpstreamStatus,
} from "@/types/market";

export async function getMarketBySlug(slug: string): Promise<MarketLoadResult> {
  const catalog = getSneakerBySlug(slug);
  if (!catalog) {
    return {
      ok: false,
      code: "not_found",
      error: `Sneaker "${slug}" is not in the SneakerPulse catalog.`,
    };
  }

  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      error:
        "Add a free KicksDB API key as KICKSDB_API_KEY to load live StockX data.",
    };
  }

  const productRes = await fetchStockxProduct(catalog.slug, apiKey);
  if (!productRes.ok) {
    if (productRes.status === 404) {
      return {
        ok: false,
        code: "not_found",
        error: `${catalog.name} was not found on StockX via KicksDB.`,
      };
    }
    return {
      ok: false,
      code: "upstream",
      error: `StockX data request failed (${productRes.status}). ${productRes.body.slice(0, 180)}`,
    };
  }

  const product = productRes.data.data;
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

  // Pin live ask onto non-sales series for continuity.
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
      if (historySource === "bootstrap" && chartSeries.length >= 2) {
        // still bootstrap unless we already had snapshots
      }
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

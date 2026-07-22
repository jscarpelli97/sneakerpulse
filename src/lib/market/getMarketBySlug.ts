import {
  getSneakerBySlug,
  type SneakerCatalogEntry,
} from "@/catalog/sneakers";
import {
  fetchStockxDailySales,
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { loadHistoryForSlug } from "@/lib/market/historyStore";
import { emptyMarket, mapProductToMarket } from "@/lib/market/mapProductToMarket";
import { salesToSeries, upsertToday } from "@/lib/market/metrics";
import type { HistorySource, MarketLoadResult } from "@/lib/market/types";

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
  let historySource: HistorySource = "bootstrap";
  let chartSeries = loadHistoryForSlug(catalog.slug);

  const salesRes = await fetchStockxDailySales(product.id, apiKey);
  if (salesRes.ok && (salesRes.data.data?.length ?? 0) > 1) {
    chartSeries = salesToSeries(salesRes.data.data ?? []);
    historySource = "sales";
  }

  // Pin today's live ask onto bootstrap series only for visual continuity.
  if (historySource === "bootstrap") {
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
    }),
  };
}

export function getMarketFallback(catalog: SneakerCatalogEntry) {
  return emptyMarket(catalog);
}

/** @deprecated Prefer getMarketBySlug */
export async function getDarkMochaMarket() {
  return getMarketBySlug("air-jordan-1-retro-high-dark-mocha");
}

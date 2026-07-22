import localHistory from "@/data/darkMochaPriceHistory.json";
import { DARK_MOCHA } from "@/data/darkMocha";
import {
  fetchStockxDailySales,
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { emptyMarket, mapProductToMarket } from "@/lib/market/mapProductToMarket";
import {
  salesToSeries,
  toDay,
  upsertToday,
} from "@/lib/market/metrics";
import type {
  ChartPoint,
  HistorySource,
  MarketLoadResult,
} from "@/lib/market/types";

function loadBootstrapHistory(): ChartPoint[] {
  return (localHistory.points ?? []).map((point) => ({
    date: toDay(point.date),
    price: point.price,
    orders: point.orders,
  }));
}

export async function getDarkMochaMarket(): Promise<MarketLoadResult> {
  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      error:
        "Add a free KicksDB API key as KICKSDB_API_KEY to load live StockX data.",
    };
  }

  const productRes = await fetchStockxProduct(DARK_MOCHA.slug, apiKey);
  if (!productRes.ok) {
    if (productRes.status === 404) {
      return {
        ok: false,
        code: "not_found",
        error: "Dark Mocha was not found on StockX via KicksDB.",
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
  let chartSeries = loadBootstrapHistory();

  const salesRes = await fetchStockxDailySales(product.id, apiKey);
  if (salesRes.ok && (salesRes.data.data?.length ?? 0) > 1) {
    chartSeries = salesToSeries(salesRes.data.data ?? []);
    historySource = "sales";
  }

  // Keep bootstrap chart informative, but only pin today's live ask onto
  // bootstrap series for visual continuity — never onto sales history.
  if (historySource === "bootstrap") {
    const livePrice =
      product.min_price ??
      product.avg_price ??
      chartSeries.at(-1)?.price ??
      0;
    chartSeries = upsertToday(
      chartSeries,
      livePrice,
      product.weekly_orders ? Math.round(product.weekly_orders / 7) : 1,
    );
  }

  return {
    ok: true,
    data: mapProductToMarket({
      product,
      catalog: DARK_MOCHA,
      chartSeries,
      historySource,
    }),
  };
}

export function getDarkMochaFallback() {
  return emptyMarket(DARK_MOCHA);
}

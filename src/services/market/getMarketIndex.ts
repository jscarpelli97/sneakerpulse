import {
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import type { MarketIndex } from "@/types/market";
import {
  buildBootstrapSeries,
  buildLaspeyresIndex,
  changeFromPrices,
} from "@/utils/metrics";

const INDEX_BASE = 1000;
const INDEX_DAYS = 90;

export async function getMarketIndex(
  limit = TOP_SELLERS_LIMIT,
): Promise<MarketIndex | null> {
  const apiKey = getKicksApiKey();
  if (!apiKey) return null;

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) return null;

  const members = res.data.data
    .map((product, index) => {
      const livePrice = product.min_price ?? product.avg_price ?? null;
      if (livePrice == null || !(livePrice > 0)) return null;
      const stats = product.statistics;
      const series = buildBootstrapSeries({
        livePrice,
        low:
          stats?.annual_range_low ??
          stats?.last_90_days_range_low ??
          stats?.annual_low ??
          null,
        high:
          stats?.annual_range_high ??
          stats?.last_90_days_range_high ??
          stats?.annual_high ??
          null,
        average:
          stats?.last_90_days_average_price ??
          stats?.annual_average_price ??
          product.avg_price ??
          null,
        volatility: stats?.annual_volatility ?? null,
        weeklyOrders: product.weekly_orders ?? null,
        days: INDEX_DAYS,
      });
      if (series.length < 2) return null;
      const weight = Math.max(
        1,
        product.weekly_orders ?? Math.max(1, limit - index),
      );
      return {
        id: product.slug ?? product.id ?? `member-${index}`,
        weight,
        series,
      };
    })
    .filter((member): member is NonNullable<typeof member> => member != null);

  const series = buildLaspeyresIndex(members, { baseLevel: INDEX_BASE });
  if (series.length < 2) return null;

  const level = series.at(-1)!.price;
  const yesterday = series.at(-2)?.price ?? null;
  const monthAgo = series.at(-31)?.price ?? series[0]?.price ?? null;
  const start = series[0]?.price ?? null;

  return {
    name: "SneakerPulse Index",
    ticker: "SPI100",
    level,
    baseLevel: INDEX_BASE,
    baseDate: series[0].date,
    asOf: series.at(-1)!.date,
    changeToday: changeFromPrices(level, yesterday),
    change30d: changeFromPrices(level, monthAgo),
    change90d: changeFromPrices(level, start),
    series,
    constituents: members.length,
    historySource: "bootstrap",
    methodology:
      "Volume-weighted Laspeyres basket of the current top StockX sellers (ChronoPulse-style). Levels are indexed to 1,000 at the start of the window. History uses StockX range/average stats until official sales/daily history is available.",
    fetchedAt: new Date().toISOString(),
  };
}

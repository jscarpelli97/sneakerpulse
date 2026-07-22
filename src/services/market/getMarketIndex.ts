import historicalIndex from "@/data/index/stockx-whole-market-2012-2021.json";
import extensionIndex from "@/data/index/spi-daily-extension.json";
import {
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import type { ChartPoint, MarketIndex } from "@/types/market";
import {
  buildBootstrapSeries,
  buildLaspeyresIndex,
  changeFromPrices,
} from "@/utils/metrics";

const INDEX_BASE = 1000;
/** Trailing live bootstrap window when daily extension is still thin. */
const INDEX_DAYS = 365;

type HistoricalFile = {
  name: string;
  source: string;
  note: string;
  baseLevel: number;
  baseDate: string;
  asOf: string;
  constituents: number;
  productsCovered?: number;
  citation?: string;
  citations?: string[];
  paper?: string;
  gapAfter?: string;
  peakLevel?: number;
  peakDate?: string;
  points: ChartPoint[];
};

type ExtensionFile = {
  points?: ChartPoint[];
  asOf?: string | null;
  anchorLevel?: number;
  gapBefore?: string;
};

function loadHistoricalSeries(): {
  series: ChartPoint[];
  meta: HistoricalFile;
} | null {
  const file = historicalIndex as HistoricalFile;
  if (!file?.points?.length || file.points.length < 2) return null;
  return {
    series: file.points.map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    })),
    meta: file,
  };
}

function loadExtensionSeries(): ChartPoint[] {
  const file = extensionIndex as ExtensionFile;
  if (!file?.points?.length) return [];
  return file.points
    .filter((point) => point.price > 0 && point.date)
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Merge historical + extension without inventing the 2022–gap years. */
function mergeHistoricalAndExtension(
  historical: ChartPoint[],
  extension: ChartPoint[],
): ChartPoint[] {
  if (!extension.length) return historical;
  const byDate = new Map<string, ChartPoint>();
  for (const point of historical) byDate.set(point.date, point);
  for (const point of extension) byDate.set(point.date, point);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function peakOf(series: ChartPoint[]) {
  if (!series.length)
    return { level: null as number | null, date: null as string | null };
  let peak = series[0];
  for (const point of series) {
    if (point.price > peak.price) peak = point;
  }
  return { level: peak.price, date: peak.date };
}

async function buildLiveSeries(limit: number): Promise<{
  series: ChartPoint[];
  constituents: number;
} | null> {
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
  return { series, constituents: members.length };
}

/**
 * ChronoPulse-style whole-market index:
 * - Long history: embSneakers 2012–2020 + Flurin17 daily 2020–2021
 * - Extension: daily top-seller Laspeyres from `npm run snapshot`
 * - Live window: rotating top StockX sellers (bootstrap when extension is thin)
 */
export async function getMarketIndex(
  limit = TOP_SELLERS_LIMIT,
): Promise<MarketIndex | null> {
  const historical = loadHistoricalSeries();
  const extension = loadExtensionSeries();
  const live = await buildLiveSeries(limit);

  if (!historical && !live && extension.length < 2) return null;

  const coreHistorical = historical?.series ?? [];
  const historicalSeries = mergeHistoricalAndExtension(
    coreHistorical,
    extension,
  );
  const liveSeries = live?.series ?? [];
  const primary =
    historicalSeries.length >= 2 ? historicalSeries : liveSeries;
  const liveLevel = liveSeries.at(-1)?.price ?? primary.at(-1)!.price;
  const historicalEnd = historicalSeries.at(-1)?.price ?? null;
  const histPeak = peakOf(historicalSeries);

  const liveYesterday = liveSeries.at(-2)?.price ?? null;
  const liveMonth = liveSeries.at(-31)?.price ?? liveSeries[0]?.price ?? null;
  const liveStart = liveSeries[0]?.price ?? null;

  const productsCovered = historical?.meta.productsCovered;
  const gapAfter = historical?.meta.gapAfter ?? "2021-12-26";
  const hasExtension = extension.length > 0;
  const citation =
    historical?.meta.citations?.[0] ?? historical?.meta.citation ?? null;

  return {
    name: "SneakerPulse Index",
    ticker: "SPI",
    level: liveLevel,
    liveLevel,
    historicalEndLevel: historicalEnd,
    baseLevel: INDEX_BASE,
    baseDate: primary[0].date,
    asOf: liveSeries.at(-1)?.date ?? primary.at(-1)!.date,
    changeToday: changeFromPrices(liveLevel, liveYesterday),
    change30d: changeFromPrices(liveLevel, liveMonth),
    change90d: changeFromPrices(liveLevel, liveStart),
    changeHistorical:
      historicalSeries.length >= 2
        ? changeFromPrices(
            historicalSeries.at(-1)!.price,
            historicalSeries[0]!.price,
          )
        : null,
    peakLevel: histPeak.level,
    peakDate: histPeak.date,
    series: primary,
    liveSeries,
    historicalSeries,
    constituents: live?.constituents ?? historical?.meta.constituents ?? 0,
    historicalConstituents: historical?.meta.constituents ?? null,
    historySource:
      historical && live
        ? "hybrid"
        : historical
          ? "whole_market"
          : "bootstrap",
    methodology: historical
      ? `ChronoPulse-style whole StockX market index. Apr 2012–Jul 2020: rotating monthly top ${historical.meta.constituents} colorways (embSneakers, ${productsCovered?.toLocaleString?.() ?? productsCovered ?? "11k+"} products). Nov 2020–Dec 2021: daily top-200 from Flurin17 snapshots (~4k products). Aug–Oct 2020 held flat. ${hasExtension ? `Daily extension resumes from snapshots after the public-data gap. ` : `No free public whole-market daily feed fills ${gapAfter} → today yet — run npm run snapshot daily to extend. `}ALL/1Y = long market series; 3M = live top sellers.`
      : "Volume-weighted Laspeyres basket of the current top StockX sellers. Shoes rotate with live sales rank.",
    citation,
    fetchedAt: new Date().toISOString(),
  };
}

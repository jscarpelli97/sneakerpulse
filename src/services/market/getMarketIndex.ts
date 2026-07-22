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

function roundLevel(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * One continuous SPI line from the earliest history through today:
 * - keep long history until the live window starts
 * - carry the last historical level across the public-data gap
 * - apply live day-over-day returns through the present
 * - prefer real daily extension points (from `npm run snapshot`) once we have a chain
 */
function buildContinuousSeries(
  historical: ChartPoint[],
  extension: ChartPoint[],
  live: ChartPoint[],
): ChartPoint[] {
  const core = historical
    .filter((point) => point.price > 0 && point.date)
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const ext = extension
    .filter((point) => point.price > 0 && point.date)
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (core.length < 2 && live.length < 2) {
    return ext.length >= 2 ? ext : core.length ? core : ext;
  }

  let continuous = core.slice();

  if (live.length >= 2) {
    const liveStart = live[0].date.slice(0, 10);
    const head = continuous.filter((point) => point.date < liveStart);
    const anchor = head.at(-1) ?? continuous.at(-1);
    if (anchor) {
      let level = anchor.price;
      const tail: ChartPoint[] = [];
      for (let i = 0; i < live.length; i++) {
        if (i > 0) {
          const prev = live[i - 1].price;
          const curr = live[i].price;
          if (prev > 0 && curr > 0) level *= curr / prev;
        }
        tail.push({
          date: live[i].date.slice(0, 10),
          price: roundLevel(level),
          orders: live[i].orders ?? 1,
        });
      }
      continuous = [...head, ...tail];
    }
  }

  // Real snapshot chain (≥2 days) replaces the overlapping live tail on SPI scale.
  if (ext.length >= 2) {
    const extStart = ext[0].date;
    const head = continuous.filter((point) => point.date < extStart);
    const headLevel = head.at(-1)?.price ?? ext[0].price;
    const scale = ext[0].price > 0 ? headLevel / ext[0].price : 1;
    const extTail = ext.map((point) => ({
      date: point.date,
      price: roundLevel(point.price * scale),
      orders: point.orders ?? 1,
    }));
    continuous = [...head, ...extTail];
  } else if (ext.length === 1 && live.length < 2) {
    const byDate = new Map(continuous.map((point) => [point.date, point]));
    byDate.set(ext[0].date, ext[0]);
    continuous = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  return continuous;
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
  const liveSeries = live?.series ?? [];
  const continuous = buildContinuousSeries(
    coreHistorical,
    extension,
    liveSeries,
  );
  if (continuous.length < 2) return null;

  const level = continuous.at(-1)!.price;
  const histPeak = peakOf(continuous);

  const yesterday = continuous.at(-2)?.price ?? null;
  const monthAgo = continuous.at(-31)?.price ?? continuous[0]?.price ?? null;
  const windowStart = continuous[0]?.price ?? null;

  // Live-window slice of the same continuous series (for short-range charts).
  const liveWindow = (() => {
    if (liveSeries.length < 2) return continuous.slice(-90);
    const from = liveSeries[0].date.slice(0, 10);
    const sliced = continuous.filter((point) => point.date >= from);
    return sliced.length >= 2 ? sliced : continuous.slice(-90);
  })();

  const productsCovered = historical?.meta.productsCovered;
  const citation =
    historical?.meta.citations?.[0] ?? historical?.meta.citation ?? null;

  return {
    name: "SneakerPulse Index",
    ticker: "SPI",
    level,
    liveLevel: level,
    historicalEndLevel: level,
    baseLevel: INDEX_BASE,
    baseDate: continuous[0].date,
    asOf: continuous.at(-1)!.date,
    changeToday: changeFromPrices(level, yesterday),
    change30d: changeFromPrices(level, monthAgo),
    change90d: changeFromPrices(
      level,
      liveWindow[0]?.price ?? windowStart,
    ),
    changeHistorical: changeFromPrices(level, continuous[0].price),
    peakLevel: histPeak.level,
    peakDate: histPeak.date,
    series: continuous,
    liveSeries: liveWindow,
    historicalSeries: continuous,
    constituents: live?.constituents ?? historical?.meta.constituents ?? 0,
    historicalConstituents: historical?.meta.constituents ?? null,
    historySource:
      historical && live
        ? "hybrid"
        : historical
          ? "whole_market"
          : "bootstrap",
    methodology: historical
      ? `One continuous ChronoPulse-style SPI from ${continuous[0].date} through ${continuous.at(-1)!.date}. Apr 2012–Jul 2020: embSneakers rotating top ${historical.meta.constituents} (${productsCovered?.toLocaleString?.() ?? productsCovered ?? "11k+"} products). Nov 2020–Dec 2021: Flurin17 daily top-200. The Jan 2022 public-data gap is bridged at the last known level, then live top-seller returns carry the series to today; daily snapshots take over as they accumulate.`
      : "Volume-weighted Laspeyres basket of the current top StockX sellers. Shoes rotate with live sales rank.",
    citation,
    fetchedAt: new Date().toISOString(),
  };
}

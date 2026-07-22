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

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const ms = Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return date;
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

/** Fill every calendar day through `throughDate` using last-observation-carried-forward. */
export function appendLocfThrough(
  points: ChartPoint[],
  throughDate: string,
): ChartPoint[] {
  if (!points.length) return points;
  const through = throughDate.slice(0, 10);
  const sorted = points
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 0,
    }))
    .filter((point) => point.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!sorted.length) return [];

  const out: ChartPoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    if (out.length === 0 || out[out.length - 1].date !== cur.date) {
      out.push({ ...cur });
    } else {
      out[out.length - 1] = { ...cur };
    }
    const nextBound =
      i + 1 < sorted.length ? sorted[i + 1].date : addDays(through, 1);
    let cursor = addDays(cur.date, 1);
    while (cursor < nextBound && cursor <= through) {
      out.push({ date: cursor, price: cur.price, orders: 0 });
      cursor = addDays(cursor, 1);
    }
  }

  // If last observed point is after `through`, trim; if before, loop above already filled.
  return out.filter((point) => point.date <= through);
}

/**
 * One continuous SPI line from the earliest history through today.
 * Always extends the time axis to `asOf` (default: today) so ALL is never stuck in 2021.
 */
export function buildContinuousSeries(
  historical: ChartPoint[],
  extension: ChartPoint[],
  live: ChartPoint[],
  asOf = todayUtc(),
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

  const liveSeries = live
    .filter((point) => point.price > 0 && point.date)
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (core.length < 2 && liveSeries.length < 2 && ext.length < 1) {
    return [];
  }

  // 1) Start from long history (or live alone).
  let continuous = core.length ? core.slice() : liveSeries.slice();

  // 2) Always bridge calendar days through today so ALL reaches the present.
  continuous = appendLocfThrough(continuous, asOf);

  // 3) Paint live day-over-day returns onto the bridged tail (same SPI level).
  if (liveSeries.length >= 2) {
    const liveStart = liveSeries[0].date;
    const byDate = new Map(continuous.map((point) => [point.date, point]));
    const anchorDate = addDays(liveStart, -1);
    const anchor =
      byDate.get(anchorDate) ??
      [...byDate.values()].reverse().find((point) => point.date < liveStart) ??
      continuous.at(-1);

    if (anchor) {
      let level = anchor.price;
      for (let i = 0; i < liveSeries.length; i++) {
        if (i > 0) {
          const prev = liveSeries[i - 1].price;
          const curr = liveSeries[i].price;
          if (prev > 0 && curr > 0) level *= curr / prev;
        }
        const date = liveSeries[i].date;
        if (date > asOf) break;
        byDate.set(date, {
          date,
          price: roundLevel(level),
          orders: liveSeries[i].orders ?? 1,
        });
      }
      continuous = [...byDate.values()].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
    }
  }

  // 4) Real snapshot extension points always win on their dates (SPI scale).
  if (ext.length >= 1) {
    const byDate = new Map(continuous.map((point) => [point.date, point]));
    if (ext.length >= 2) {
      const extStart = ext[0].date;
      const prior =
        [...byDate.values()].reverse().find((point) => point.date < extStart) ??
        null;
      const headLevel = prior?.price ?? ext[0].price;
      const scale = ext[0].price > 0 ? headLevel / ext[0].price : 1;
      for (const point of ext) {
        byDate.set(point.date, {
          date: point.date,
          price: roundLevel(point.price * scale),
          orders: point.orders ?? 1,
        });
      }
      // LOCF from last extension through asOf so we don't drop the tip.
      const lastExt = ext[ext.length - 1];
      let cursor = addDays(lastExt.date, 1);
      const lastPrice = roundLevel(lastExt.price * scale);
      while (cursor <= asOf) {
        if (!byDate.has(cursor)) {
          byDate.set(cursor, { date: cursor, price: lastPrice, orders: 0 });
        }
        cursor = addDays(cursor, 1);
      }
    } else {
      byDate.set(ext[0].date, { ...ext[0] });
      // Carry extension level forward if it's the newest observation.
      let cursor = addDays(ext[0].date, 1);
      while (cursor <= asOf) {
        byDate.set(cursor, {
          date: cursor,
          price: ext[0].price,
          orders: 0,
        });
        cursor = addDays(cursor, 1);
      }
    }
    continuous = [...byDate.values()]
      .filter((point) => point.date <= asOf)
      .sort((a, b) => a.date.localeCompare(b.date));
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
 * - Bridge through today (LOCF) so ALL always reaches the present
 * - Live window + daily extension overlay on that continuous axis
 */
export async function getMarketIndex(
  limit = TOP_SELLERS_LIMIT,
): Promise<MarketIndex | null> {
  const historical = loadHistoricalSeries();
  const extension = loadExtensionSeries();
  const live = await buildLiveSeries(limit);
  const asOf = todayUtc();

  if (!historical && !live && extension.length < 1) return null;

  const coreHistorical = historical?.series ?? [];
  const liveSeries = live?.series ?? [];
  const continuous = buildContinuousSeries(
    coreHistorical,
    extension,
    liveSeries,
    asOf,
  );
  if (continuous.length < 2) return null;

  const level = continuous.at(-1)!.price;
  const histPeak = peakOf(continuous);

  const yesterday = continuous.at(-2)?.price ?? null;
  const monthAgo = continuous.at(-31)?.price ?? continuous[0]?.price ?? null;

  const liveWindow = continuous.filter(
    (point) => point.date >= addDays(asOf, -(INDEX_DAYS - 1)),
  );

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
      continuous.at(-90)?.price ?? continuous[0]?.price ?? null,
    ),
    changeHistorical: changeFromPrices(level, continuous[0].price),
    peakLevel: histPeak.level,
    peakDate: histPeak.date,
    series: continuous,
    liveSeries: liveWindow.length >= 2 ? liveWindow : continuous.slice(-90),
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
      ? `One continuous ChronoPulse-style SPI from ${continuous[0].date} through ${continuous.at(-1)!.date}. Apr 2012–Jul 2020: embSneakers rotating top ${historical.meta.constituents} (${productsCovered?.toLocaleString?.() ?? productsCovered ?? "11k+"} products). Nov 2020–Dec 2021: Flurin17 daily top-200. Missing public daily tape after Dec 2021 is bridged at the last known level through today; live top-seller returns and daily snapshots overlay the recent window.`
      : "Volume-weighted Laspeyres basket of the current top StockX sellers. Shoes rotate with live sales rank.",
    citation,
    fetchedAt: new Date().toISOString(),
  };
}

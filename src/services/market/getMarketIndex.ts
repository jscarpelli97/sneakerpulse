import premiumHistory from "@/data/index/stockx-premium-2020-2021.json";
import extensionIndex from "@/data/index/spi-daily-extension.json";
import savedBasket from "@/data/index/spi-chrono-basket.json";
import {
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import {
  PREMIUM_INDEX_BASE,
  buildPremiumIndexLevel,
  parseRetailPrice,
  premiumPoint,
} from "@/lib/index/premiumIndex";
import {
  SPI_BRAND_COUNT,
  SPI_MODELS_PER_BRAND,
  basketNeedsRebalance,
  filterProductsToBasket,
  selectChronoBasket,
  type SpiChronoBasket,
} from "@/lib/index/selectChronoBasket";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import type { KicksProduct } from "@/types/kicksdb";
import type { ChartPoint, MarketIndex } from "@/types/market";
import { changeFromPrices } from "@/utils/metrics";

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
  peakLevel?: number;
  peakDate?: string;
  points: ChartPoint[];
};

type ExtensionFile = {
  points?: ChartPoint[];
  asOf?: string | null;
};

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function loadPremiumHistory(): {
  series: ChartPoint[];
  meta: HistoricalFile;
} | null {
  const file = premiumHistory as HistoricalFile;
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
    // Premium index lives near 50–300. Drop legacy absolute-dollar seeds (~5000).
    .filter((point) => point.price > 0 && point.price < 500 && point.date)
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function loadSavedBasket(): SpiChronoBasket | null {
  const file = savedBasket as SpiChronoBasket;
  if (!file?.members?.length) return null;
  return file;
}

function resolveBasket(
  products: KicksProduct[],
  previous: SpiChronoBasket | null,
): SpiChronoBasket {
  if (previous && !basketNeedsRebalance(previous)) return previous;
  return selectChronoBasket(products, {
    brandCount: SPI_BRAND_COUNT,
    modelsPerBrand: SPI_MODELS_PER_BRAND,
    previous,
  });
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

function addDays(date: string, days: number): string {
  const ms = Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return date;
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const am = Date.parse(`${a.slice(0, 10)}T00:00:00.000Z`);
  const bm = Date.parse(`${b.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(am) || !Number.isFinite(bm)) return 0;
  return Math.round((bm - am) / 86_400_000);
}

/**
 * Merge boom-era premium history with live/extension premiums.
 *
 * After Dec 2021 there is no public daily tape. To make ALL read through
 * today (not look stuck in 2021), we draw a straight-line bridge from the
 * last boom print to the live premium. That is illustrative of the cooling
 * — not invented "still hot" LOCF at the peak.
 */
export function buildPremiumSeries(
  historical: ChartPoint[],
  extension: ChartPoint[],
  liveLevel: number | null,
  asOf: string,
): ChartPoint[] {
  const byDate = new Map<string, ChartPoint>();
  for (const point of historical) {
    if (point.price > 0) byDate.set(point.date.slice(0, 10), { ...point });
  }
  for (const point of extension) {
    if (point.price > 0 && point.price < 500) {
      byDate.set(point.date.slice(0, 10), { ...point });
    }
  }
  if (liveLevel != null && liveLevel > 0) {
    byDate.set(asOf.slice(0, 10), premiumPoint(asOf, liveLevel, 1));
  }

  let series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (series.length < 2) return series;

  const endDate = asOf.slice(0, 10);
  const endLevel =
    liveLevel != null && liveLevel > 0
      ? liveLevel
      : series.at(-1)!.price;

  // Ensure the tip is today at the live/extension premium.
  byDate.set(endDate, premiumPoint(endDate, endLevel, series.at(-1)!.orders ?? 1));
  series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Fill any calendar holes (esp. 2022→today) with a linear bridge so the
  // time axis reaches the present and the post-boom cool-down is visible.
  const filled: ChartPoint[] = [];
  for (let i = 0; i < series.length; i++) {
    const cur = series[i];
    filled.push(cur);
    if (i === series.length - 1) break;
    const next = series[i + 1];
    const gap = daysBetween(cur.date, next.date);
    if (gap <= 1) continue;
    for (let step = 1; step < gap; step++) {
      const t = step / gap;
      const price =
        Math.round((cur.price * (1 - t) + next.price * t) * 100) / 100;
      filled.push({
        date: addDays(cur.date, step),
        price,
        orders: 0,
      });
    }
  }

  return filled.filter((point) => point.date <= endDate);
}

async function measureLivePremium(limit: number): Promise<{
  level: number;
  premiumPercent: number;
  constituents: number;
  atOrBelowRetail: number;
  basket: SpiChronoBasket;
} | null> {
  const apiKey = getKicksApiKey();
  if (!apiKey) return null;

  const res = await fetchTopStockxSneakers(apiKey, limit);
  if (!res.ok || !res.data.data?.length) return null;

  const basket = resolveBasket(res.data.data, loadSavedBasket());
  const pool = filterProductsToBasket(res.data.data, basket);
  const rows = (pool.length ? pool : res.data.data).map((product) => ({
    ask: product.min_price ?? product.avg_price ?? null,
    retail: parseRetailPrice(product),
    weight:
      basket.members.find((m) => m.slug === product.slug)?.weight ??
      product.weekly_orders ??
      1,
  }));

  const measured = buildPremiumIndexLevel(rows);
  if (measured.level == null || measured.premiumPercent == null) return null;

  return {
    level: measured.level,
    premiumPercent: measured.premiumPercent,
    constituents: measured.constituents,
    atOrBelowRetail: measured.atOrBelowRetail,
    basket,
  };
}

function howItWorksFaq(
  basket: SpiChronoBasket | null,
  live: { constituents: number; atOrBelowRetail: number } | null,
): MarketIndex["howItWorks"] {
  const brands = basket?.brandCount ?? SPI_BRAND_COUNT;
  const models = basket?.modelsPerBrand ?? SPI_MODELS_PER_BRAND;
  const count = live?.constituents ?? basket?.members.length ?? brands * models;
  const below = live?.atOrBelowRetail;
  return {
    selection: `SPI watches StockX’s ${brands} bestselling sneaker brands in the current top-seller pool and keeps up to ${models} models per brand (${count} colorways in the live basket).`,
    calculation: `Instead of a dollar price index (which stays high when retail prices rise), SPI tracks the volume-weighted ask ÷ retail ratio. 100 = at retail, above 100 = premiums, below 100 = sitting below retail${below != null ? ` — ${below} of ${count} basket models are at or below retail today` : ""}. That matches how sneaker markets actually feel after the 2021 boom.`,
    updates: `Premiums refresh with live StockX asks daily. Brand/model weights rebalance every six months${basket?.nextRebalanceAt ? ` (next ${basket.nextRebalanceAt})` : ""}.`,
  };
}

/**
 * SneakerPulse Index — premium-vs-retail market health (ChronoPulse-inspired
 * basket, but a sneaker-native equation).
 */
export async function getMarketIndex(
  limit = TOP_SELLERS_LIMIT,
): Promise<MarketIndex | null> {
  const historical = loadPremiumHistory();
  const extension = loadExtensionSeries();
  const live = await measureLivePremium(limit);
  const asOf = todayUtc();
  const basket = live?.basket ?? loadSavedBasket();

  if (!historical && live == null && extension.length < 1) return null;

  const continuous = buildPremiumSeries(
    historical?.series ?? [],
    extension,
    live?.level ?? null,
    asOf,
  );
  if (continuous.length < 2) return null;

  const level = continuous.at(-1)!.price;
  const histPeak = peakOf(continuous);
  const yesterday = continuous.at(-2)?.price ?? null;
  const monthAgo = continuous.at(-31)?.price ?? continuous[0]?.price ?? null;
  const howItWorks = howItWorksFaq(
    basket,
    live
      ? {
          constituents: live.constituents,
          atOrBelowRetail: live.atOrBelowRetail,
        }
      : null,
  );

  const premiumPercent = Math.round((level - PREMIUM_INDEX_BASE) * 100) / 100;

  return {
    name: "SneakerPulse Index",
    ticker: "SPI",
    level,
    liveLevel: level,
    historicalEndLevel: level,
    baseLevel: PREMIUM_INDEX_BASE,
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
    liveSeries: continuous.slice(-120),
    historicalSeries: continuous,
    constituents: live?.constituents ?? basket?.members.length ?? 0,
    historicalConstituents: historical?.meta.productsCovered ?? null,
    brandCount: basket?.brandCount ?? null,
    modelsPerBrand: basket?.modelsPerBrand ?? null,
    brands: basket?.brands ?? [],
    rebalancedAt: basket?.rebalancedAt ?? null,
    nextRebalanceAt: basket?.nextRebalanceAt ?? null,
    historySource: historical && live ? "hybrid" : historical ? "whole_market" : "bootstrap",
    methodology: `${howItWorks.calculation} Boom-era tape (Nov 2020–Dec 2021) is Flurin17 daily StockX premiums. 2022→today has no public daily premium feed, so ALL draws a straight-line bridge from the last 2021 print down to today’s live basket (~${Math.round(level)}) — that shows the cool-down without faking a flat “still hot” market.`,
    howItWorks,
    citation: historical?.meta.citation ?? "https://github.com/Flurin17/stockXsalesData",
    fetchedAt: new Date().toISOString(),
  };
}

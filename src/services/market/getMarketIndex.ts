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
    .filter((point) => point.price > 0 && point.date)
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

/**
 * Merge boom-era premium history with live/extension premiums.
 * Do NOT LOCF the 2021 peak across the missing years — that made the
 * post-boom dump look like the market stayed hot.
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
    if (point.price > 0) byDate.set(point.date.slice(0, 10), { ...point });
  }
  if (liveLevel != null && liveLevel > 0) {
    byDate.set(asOf, premiumPoint(asOf, liveLevel, 1));
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
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
    methodology: `${howItWorks.calculation} Boom-era tape (Nov 2020–Dec 2021) comes from Flurin17 daily StockX premiums; there is no honest public daily premium tape for 2022–mid‑2025, so the chart connects the 2021 print to today’s live basket without inventing a flat “still hot” bridge.`,
    howItWorks,
    citation: historical?.meta.citation ?? "https://github.com/Flurin17/stockXsalesData",
    fetchedAt: new Date().toISOString(),
  };
}

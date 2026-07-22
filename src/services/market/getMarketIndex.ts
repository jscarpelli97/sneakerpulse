import premiumHistory from "@/data/index/stockx-premium-2020-2021.json";
import extensionIndex from "@/data/index/spi-daily-extension.json";
import savedBasket from "@/data/index/spi-chrono-basket.json";
import fs from "node:fs";
import path from "node:path";
import {
  fetchTopStockxSneakers,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { kicksLiveReadsEnabled } from "@/lib/dataMode";
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
  points?: Array<ChartPoint & { spi?: number }>;
  asOf?: string | null;
};

type OpenDataFile = {
  points?: Array<{
    date: string;
    spi: number;
    constituents?: number;
  }>;
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

/** Public open-data tape (same CSV/JSON folks clone) — preferred forward series. */
function loadOpenDataSeries(): ChartPoint[] {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "open-data/spi/daily.json"),
      "utf8",
    );
    const file = JSON.parse(raw) as OpenDataFile;
    return (file.points ?? [])
      .filter((point) => point.spi > 0 && point.spi < 500 && point.date)
      .map((point) => ({
        date: point.date.slice(0, 10),
        price: point.spi,
        orders: point.constituents ?? 1,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

function loadLegacyExtensionSeries(): ChartPoint[] {
  const file = extensionIndex as ExtensionFile;
  if (!file?.points?.length) return [];
  return file.points
    .filter((point) => {
      const price = point.price ?? point.spi ?? 0;
      return price > 0 && price < 500 && point.date;
    })
    .map((point) => ({
      date: point.date.slice(0, 10),
      price: point.price ?? point.spi ?? 0,
      orders: point.orders ?? 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Merge open-data + in-app extension so the site chart grows with every daily commit. */
function loadExtensionSeries(): ChartPoint[] {
  const byDate = new Map<string, ChartPoint>();
  for (const point of loadLegacyExtensionSeries()) {
    byDate.set(point.date, point);
  }
  for (const point of loadOpenDataSeries()) {
    byDate.set(point.date, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
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
 *
 * There is no free public daily whole-market premium tape for most of
 * 2022–mid‑2025. We do NOT invent a declining bridge across that hole —
 * only real observed points (Flurin 2020–2021, then snapshot/live tips).
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
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Split on multi-month calendar holes so the chart does not draw a fake crash line. */
export function splitPremiumSegments(points: ChartPoint[], gapDays = 60): {
  historical: ChartPoint[];
  live: ChartPoint[];
} {
  if (points.length < 2) return { historical: points, live: [] };
  const dayMs = 86_400_000;
  let splitAt = -1;
  for (let i = 1; i < points.length; i++) {
    const prev = Date.parse(points[i - 1].date.slice(0, 10));
    const next = Date.parse(points[i].date.slice(0, 10));
    if (
      Number.isFinite(prev) &&
      Number.isFinite(next) &&
      next - prev > gapDays * dayMs
    ) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 0) return { historical: points, live: [] };
  return {
    historical: points.slice(0, splitAt),
    live: points.slice(splitAt),
  };
}

async function measureLivePremium(limit: number): Promise<{
  level: number;
  premiumPercent: number;
  constituents: number;
  atOrBelowRetail: number;
  basket: SpiChronoBasket;
} | null> {
  const apiKey = getKicksApiKey();
  // Index live tip uses the same page-view gate; open-data / extension fill the tape.
  if (!apiKey || !kicksLiveReadsEnabled()) return null;

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
  if (continuous.length < 2 && live == null) return null;
  if (continuous.length < 1) return null;

  const segments = splitPremiumSegments(continuous);
  const histSeg = segments.historical;
  const liveSeg = segments.live;
  const level =
    live?.level ??
    liveSeg.at(-1)?.price ??
    continuous.at(-1)?.price ??
    PREMIUM_INDEX_BASE;
  const histPeak = peakOf(histSeg.length ? histSeg : continuous);

  // Day-over-day only from the live/snapshot tip — never vs a 2021 point.
  const livePrior =
    liveSeg.length >= 2 ? liveSeg.at(-2)?.price ?? null : null;
  const liveMonth =
    liveSeg.length >= 31
      ? liveSeg.at(-31)?.price ?? null
      : liveSeg[0]?.price ?? null;

  const howItWorks = howItWorksFaq(
    basket,
    live
      ? {
          constituents: live.constituents,
          atOrBelowRetail: live.atOrBelowRetail,
        }
      : null,
  );

  const boomEnd = histSeg.at(-1)?.price ?? null;

  return {
    name: "SneakerPulse Index",
    ticker: "SPI",
    level,
    liveLevel: level,
    historicalEndLevel: boomEnd,
    baseLevel: PREMIUM_INDEX_BASE,
    baseDate: continuous[0]?.date ?? asOf,
    asOf: liveSeg.at(-1)?.date ?? continuous.at(-1)?.date ?? asOf,
    changeToday: changeFromPrices(level, livePrior),
    change30d: changeFromPrices(level, liveMonth),
    change90d: changeFromPrices(level, liveSeg[0]?.price ?? null),
    changeHistorical:
      boomEnd != null && histSeg[0]
        ? changeFromPrices(level, histSeg[0].price)
        : changeFromPrices(level, continuous[0]?.price ?? null),
    peakLevel: histPeak.level,
    peakDate: histPeak.date,
    series: continuous,
    liveSeries: liveSeg.length ? liveSeg : continuous.slice(-1),
    historicalSeries: histSeg.length ? histSeg : continuous,
    constituents: live?.constituents ?? basket?.members.length ?? 0,
    historicalConstituents: historical?.meta.productsCovered ?? null,
    brandCount: basket?.brandCount ?? null,
    modelsPerBrand: basket?.modelsPerBrand ?? null,
    brands: basket?.brands ?? [],
    rebalancedAt: basket?.rebalancedAt ?? null,
    nextRebalanceAt: basket?.nextRebalanceAt ?? null,
    historySource:
      historical && live ? "hybrid" : historical ? "whole_market" : "bootstrap",
    methodology: `${howItWorks.calculation} Real daily premium tape exists for Nov 2020–Dec 2021 (Flurin17). There is no free public daily feed for 2022–mid‑2025 — that gap stays empty. From ${liveSeg[0]?.date ?? asOf} forward, each npm run snapshot / daily GitHub Action appends a real SPI point to open-data/spi/daily.csv and the homepage gold segment grows with it (${liveSeg.length} live day${liveSeg.length === 1 ? "" : "s"} so far).`,
    howItWorks: {
      ...howItWorks,
      updates: `${howItWorks.updates} The same daily file powers this website chart and the public open-data repo — one append-only series.`,
    },
    citation:
      historical?.meta.citation ??
      "https://github.com/Flurin17/stockXsalesData",
    fetchedAt: new Date().toISOString(),
  };
}

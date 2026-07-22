import localHistory from "@/data/darkMochaPriceHistory.json";
import { DARK_MOCHA } from "@/data/darkMocha";
import type {
  ChangeMetric,
  ChartPoint,
  MarketLoadResult,
  SneakerMarket,
  VolumeMetric,
} from "@/lib/stockx/types";

const KICKS_BASE = "https://api.kicks.dev/v3";
const SLUG = DARK_MOCHA.slug;

type KicksProduct = {
  id: string;
  title: string;
  brand: string;
  sku?: string;
  image?: string;
  link?: string;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
  weekly_orders?: number | null;
  rank?: number | null;
  statistics?: {
    annual_high?: number;
    annual_low?: number;
    annual_average_price?: number;
    annual_volatility?: number;
    annual_sales_count?: number;
    last_90_days_range_high?: number;
    last_90_days_range_low?: number;
    last_90_days_average_price?: number;
    last_90_days_sales_count?: number;
  } | null;
  variants?: Array<{
    size: string;
    lowest_ask: number | null;
    total_asks: number | null;
    hidden?: boolean;
    sales_count_15_days?: number;
    sales_count_30_days?: number;
    sales_count_60_days?: number;
  }> | null;
};

type DailySale = {
  avg_amount: number;
  orders: number;
  date: string;
};

function getApiKey() {
  return process.env.KICKSDB_API_KEY?.trim() || "";
}

async function kicksFetch<T>(
  path: string,
  apiKey: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const response = await fetch(`${KICKS_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 300 },
  });

  const body = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: JSON.parse(body) as T };
}

function changeFromPrices(
  current: number,
  previous: number | null | undefined,
): ChangeMetric {
  if (previous == null || previous === 0) return null;
  const absolute = current - previous;
  const percent = (absolute / previous) * 100;
  return { absolute, percent };
}

function sumSales(points: ChartPoint[], days: number): VolumeMetric {
  const slice = points.slice(-days);
  return {
    pairs: slice.reduce((total, point) => total + point.orders, 0),
    notional: slice.reduce(
      (total, point) => total + point.price * point.orders,
      0,
    ),
  };
}

function toDay(date: string) {
  return date.slice(0, 10);
}

function loadLocalHistory(): ChartPoint[] {
  return (localHistory.points ?? []).map((point) => ({
    date: toDay(point.date),
    price: point.price,
    orders: point.orders,
  }));
}

function salesToSeries(sales: DailySale[]): ChartPoint[] {
  return sales
    .slice()
    .reverse()
    .map((sale) => ({
      date: toDay(sale.date),
      price: sale.avg_amount,
      orders: sale.orders,
    }))
    .filter((point) => point.price > 0);
}

function upsertToday(
  series: ChartPoint[],
  price: number,
  orders: number,
): ChartPoint[] {
  const today = new Date().toISOString().slice(0, 10);
  const next = series.filter((point) => point.date !== today);
  next.push({ date: today, price, orders: Math.max(orders, 1) });
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

function buildMarket(
  product: KicksProduct,
  chartSeries: ChartPoint[],
  historySource: "sales" | "local",
): SneakerMarket {
  const variants = (product.variants ?? []).filter((variant) => !variant.hidden);
  const asks = variants
    .map((variant) => variant.lowest_ask)
    .filter((ask): ask is number => typeof ask === "number" && ask > 0);

  const price =
    product.min_price ??
    (asks.length ? Math.min(...asks) : null) ??
    product.avg_price ??
    0;

  const askCount = variants.reduce(
    (total, variant) => total + (variant.total_asks ?? 0),
    0,
  );
  const sales15d = variants.reduce(
    (total, variant) => total + (variant.sales_count_15_days ?? 0),
    0,
  );
  const sales30d = variants.reduce(
    (total, variant) => total + (variant.sales_count_30_days ?? 0),
    0,
  );
  const sales60d = variants.reduce(
    (total, variant) => total + (variant.sales_count_60_days ?? 0),
    0,
  );

  const historyAvailable = chartSeries.length > 1;
  const latestHistory = chartSeries.at(-1)?.price ?? null;
  const yesterday = chartSeries.at(-2)?.price ?? null;
  const monthAgo = chartSeries.at(-31)?.price ?? chartSeries[0]?.price ?? null;
  const currentForChange = latestHistory ?? price;

  const last30 = chartSeries.slice(-30);
  const stats = product.statistics;

  const volume24h: VolumeMetric = historyAvailable
    ? sumSales(chartSeries, 1)
    : { pairs: product.weekly_orders ?? 0, notional: null };

  const volume30d: VolumeMetric = historyAvailable
    ? sumSales(chartSeries, 30)
    : {
        pairs: sales30d,
        notional:
          product.avg_price != null ? product.avg_price * sales30d : null,
      };

  return {
    id: product.id,
    name: product.title || DARK_MOCHA.name,
    brand: product.brand || DARK_MOCHA.brand,
    year: DARK_MOCHA.year,
    ticker: DARK_MOCHA.ticker,
    styleCode: product.sku || DARK_MOCHA.styleCode,
    colorway: DARK_MOCHA.colorway,
    retail: DARK_MOCHA.retail,
    image: product.image || DARK_MOCHA.fallbackImage,
    stockxUrl: product.link || DARK_MOCHA.stockxUrl,
    price,
    currency: "USD",
    changeToday: historyAvailable
      ? changeFromPrices(currentForChange, yesterday)
      : null,
    change30d: historyAvailable
      ? changeFromPrices(currentForChange, monthAgo)
      : null,
    volume24h,
    volume30d,
    stats: {
      lowestAsk: product.min_price ?? (asks.length ? Math.min(...asks) : null),
      highestAsk: product.max_price ?? (asks.length ? Math.max(...asks) : null),
      averageAsk: product.avg_price ?? null,
      askCount,
      high24h: historyAvailable
        ? (chartSeries.at(-1)?.price ?? null)
        : (product.max_price ?? null),
      low24h: historyAvailable
        ? (chartSeries.at(-1)?.price ?? null)
        : (product.min_price ?? null),
      high30d: last30.length
        ? Math.max(...last30.map((point) => point.price))
        : (stats?.last_90_days_range_high ?? product.max_price ?? null),
      low30d: last30.length
        ? Math.min(...last30.map((point) => point.price))
        : (stats?.last_90_days_range_low ?? product.min_price ?? null),
      avgSale30d: last30.length
        ? last30.reduce((total, point) => total + point.price, 0) / last30.length
        : (stats?.last_90_days_average_price ?? product.avg_price ?? null),
      lastSale: latestHistory,
      sales15d,
      sales30d,
      sales60d,
      weeklyOrders: product.weekly_orders ?? null,
      rank: product.rank ?? null,
      annualHigh: stats?.annual_high ?? null,
      annualLow: stats?.annual_low ?? null,
      annualAvg: stats?.annual_average_price ?? null,
      annualVolatility: stats?.annual_volatility ?? null,
      annualSales: stats?.annual_sales_count ?? null,
    },
    chartSeries,
    historySource,
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: new Date().toISOString(),
    historyAvailable,
  };
}

export async function getDarkMochaMarket(): Promise<MarketLoadResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      error:
        "Add a free KicksDB API key as KICKSDB_API_KEY to load live StockX data.",
    };
  }

  const productQuery = new URLSearchParams({
    "display[variants]": "true",
    "display[prices]": "true",
    "display[statistics]": "true",
    market: "US",
  });

  const productRes = await kicksFetch<{ data: KicksProduct }>(
    `/stockx/products/${SLUG}?${productQuery.toString()}`,
    apiKey,
  );

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
  let historySource: "sales" | "local" = "local";
  let chartSeries = loadLocalHistory();

  const salesRes = await kicksFetch<{ data: DailySale[] | null }>(
    `/stockx/products/${product.id}/sales/daily?market=US`,
    apiKey,
  );

  if (salesRes.ok && (salesRes.data.data?.length ?? 0) > 1) {
    chartSeries = salesToSeries(salesRes.data.data ?? []);
    historySource = "sales";
  }

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

  return {
    ok: true,
    data: buildMarket(product, chartSeries, historySource),
  };
}

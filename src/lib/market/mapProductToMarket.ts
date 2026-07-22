import type { SneakerCatalogEntry } from "@/catalog/sneakers";
import type { KicksProduct } from "@/lib/kicksdb/client";
import {
  changeFromPrices,
  seriesWindowHighLow,
  sumSales,
} from "@/lib/market/metrics";
import type {
  ChartPoint,
  HistorySource,
  SizeAsk,
  SneakerMarket,
} from "@/lib/market/types";

export type CatalogIdentity = Pick<
  SneakerCatalogEntry,
  | "year"
  | "ticker"
  | "styleCode"
  | "colorway"
  | "retail"
  | "name"
  | "brand"
  | "fallbackImage"
  | "stockxUrl"
>;

export function mapProductToMarket(input: {
  product: KicksProduct;
  catalog: CatalogIdentity;
  chartSeries: ChartPoint[];
  historySource: HistorySource;
  fetchedAt?: string;
}): SneakerMarket {
  const { product, catalog, historySource } = input;
  const chartSeries = input.chartSeries;
  const salesHistory = historySource === "sales";

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

  const sizes: SizeAsk[] = variants
    .map((variant) => ({
      size: variant.size,
      sizeType: variant.size_type,
      lowestAsk: variant.lowest_ask,
      totalAsks: variant.total_asks ?? 0,
      sales15d: variant.sales_count_15_days ?? 0,
      sales30d: variant.sales_count_30_days ?? 0,
      sales60d: variant.sales_count_60_days ?? 0,
    }))
    .sort((a, b) => Number.parseFloat(a.size) - Number.parseFloat(b.size));

  const historyAvailable = chartSeries.length > 1;
  const latestHistory = chartSeries.at(-1)?.price ?? null;
  const yesterday = chartSeries.at(-2)?.price ?? null;
  const monthAgo = chartSeries.at(-31)?.price ?? chartSeries[0]?.price ?? null;
  const last30 = chartSeries.slice(-30);
  const last1 = chartSeries.slice(-1);
  const stats = product.statistics;
  const last30Bounds = seriesWindowHighLow(last30);
  const last1Bounds = seriesWindowHighLow(last1);

  // Trust-critical % changes only from official sales history.
  const changeToday = salesHistory
    ? changeFromPrices(latestHistory ?? price, yesterday)
    : null;
  const change30d = salesHistory
    ? changeFromPrices(latestHistory ?? price, monthAgo)
    : null;

  const volume24h = salesHistory
    ? sumSales(chartSeries, 1)
    : { pairs: product.weekly_orders ?? 0, notional: null };

  const volume30d = salesHistory
    ? sumSales(chartSeries, 30)
    : {
        pairs: sales30d,
        notional:
          product.avg_price != null ? product.avg_price * sales30d : null,
      };

  return {
    id: product.id,
    name: product.title || catalog.name,
    brand: product.brand || catalog.brand,
    year: catalog.year,
    ticker: catalog.ticker,
    styleCode: product.sku || catalog.styleCode,
    colorway: catalog.colorway,
    retail: catalog.retail,
    image: product.image || catalog.fallbackImage,
    stockxUrl: product.link || catalog.stockxUrl,
    price,
    currency: "USD",
    changeToday,
    change30d,
    volume24h,
    volume24hSource: salesHistory ? "sales" : "weekly_orders",
    volume30d,
    volume30dSource: salesHistory ? "sales" : "variant_sales",
    stats: {
      lowestAsk: product.min_price ?? (asks.length ? Math.min(...asks) : null),
      highestAsk: product.max_price ?? (asks.length ? Math.max(...asks) : null),
      averageAsk: product.avg_price ?? null,
      askCount,
      high24h: salesHistory ? last1Bounds.high : null,
      low24h: salesHistory ? last1Bounds.low : null,
      high30d: salesHistory
        ? last30Bounds.high
        : (stats?.last_90_days_range_high ?? null),
      high30dSource: salesHistory
        ? "sales"
        : stats?.last_90_days_range_high != null
          ? "stockx_stats"
          : null,
      low30d: salesHistory
        ? last30Bounds.low
        : (stats?.last_90_days_range_low ?? null),
      low30dSource: salesHistory
        ? "sales"
        : stats?.last_90_days_range_low != null
          ? "stockx_stats"
          : null,
      avgSale30d: salesHistory
        ? last30.length
          ? last30.reduce((total, point) => total + point.price, 0) /
            last30.length
          : null
        : (stats?.last_90_days_average_price ?? null),
      avgSale30dSource: salesHistory
        ? "sales"
        : stats?.last_90_days_average_price != null
          ? "stockx_stats"
          : null,
      lastSale: salesHistory ? latestHistory : null,
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
    sizes,
    chartSeries,
    historySource,
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    historyAvailable,
  };
}

export function emptyMarket(catalog: CatalogIdentity): SneakerMarket {
  return {
    id: catalog.styleCode,
    name: catalog.name,
    brand: catalog.brand,
    year: catalog.year,
    ticker: catalog.ticker,
    styleCode: catalog.styleCode,
    colorway: catalog.colorway,
    retail: catalog.retail,
    image: catalog.fallbackImage,
    stockxUrl: catalog.stockxUrl,
    price: 0,
    currency: "USD",
    changeToday: null,
    change30d: null,
    volume24h: { pairs: 0, notional: null },
    volume24hSource: "weekly_orders",
    volume30d: { pairs: 0, notional: null },
    volume30dSource: "variant_sales",
    stats: {
      lowestAsk: null,
      highestAsk: null,
      averageAsk: null,
      askCount: 0,
      high24h: null,
      low24h: null,
      high30d: null,
      high30dSource: null,
      low30d: null,
      low30dSource: null,
      avgSale30d: null,
      avgSale30dSource: null,
      lastSale: null,
      sales15d: 0,
      sales30d: 0,
      sales60d: 0,
      weeklyOrders: null,
      rank: null,
      annualHigh: null,
      annualLow: null,
      annualAvg: null,
      annualVolatility: null,
      annualSales: null,
    },
    sizes: [],
    chartSeries: [],
    historySource: "bootstrap",
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: new Date().toISOString(),
    historyAvailable: false,
  };
}

import { getSneakerBySlug, getOfflineQuoteBySlug } from "@/services/catalog/sneakers";
import type { SneakerCatalogEntry } from "@/types/catalog";
import {
  fetchStockxDailySales,
  fetchStockxProduct,
  getKicksApiKey,
} from "@/lib/kicksdb/client";
import { mapListedProductToCatalog } from "@/services/catalog/mapProductToCatalog";
import { resolveLocalHistory } from "@/services/market/historyStore";
import { emptyMarket, mapProductToMarket } from "@/lib/mapProductToMarket";
import {
  buildBootstrapSeries,
  salesToSeries,
  upsertToday,
} from "@/utils/metrics";
import type {
  HistorySource,
  MarketLoadResult,
  UpstreamStatus,
} from "@/types/market";
import type { KicksProduct } from "@/types/kicksdb";

function marketFromCachedCatalog(slug: string): MarketLoadResult {
  const quote = getOfflineQuoteBySlug(slug);
  if (!quote) {
    return {
      ok: false,
      code: "not_found",
      error: `Sneaker "${slug}" was not found in the free offline catalog.`,
    };
  }

  const catalog: SneakerCatalogEntry = {
    slug: quote.slug,
    ticker: quote.ticker,
    styleCode: quote.styleCode,
    name: quote.name,
    brand: quote.brand,
    year: quote.year,
    releaseDate: quote.releaseDate,
    colorway: quote.colorway,
    retail: quote.retail,
    stockxUrl: quote.stockxUrl,
    fallbackImage: quote.fallbackImage,
    featured: quote.featured,
    rank: quote.rank,
  };

  const local = resolveLocalHistory(catalog.slug);
  let chartSeries = local.series;
  let historySource: HistorySource = local.source;
  const livePrice = quote.price ?? chartSeries.at(-1)?.price ?? 0;

  if (chartSeries.length < 2 && livePrice > 0) {
    chartSeries = buildBootstrapSeries({
      livePrice,
      low: livePrice * 0.85,
      high: livePrice * 1.15,
      average: livePrice,
      volatility: 0.12,
      weeklyOrders: quote.weeklyOrders,
      days: 30,
    });
    historySource = "bootstrap";
  } else if (livePrice > 0) {
    chartSeries = upsertToday(
      chartSeries,
      livePrice,
      quote.weeklyOrders ? Math.round(quote.weeklyOrders / 7) : 1,
    );
  }

  const product: KicksProduct = {
    id: catalog.slug,
    title: catalog.name,
    brand: catalog.brand,
    sku: catalog.styleCode,
    slug: catalog.slug,
    image: catalog.fallbackImage,
    link: catalog.stockxUrl,
    min_price: quote.price,
    avg_price: quote.price,
    weekly_orders: quote.weeklyOrders,
    rank: quote.rank,
  };

  return {
    ok: true,
    data: mapProductToMarket({
      product,
      catalog,
      chartSeries,
      historySource,
      upstreamStatus: "cached",
    }),
  };
}

export async function getMarketBySlug(slug: string): Promise<MarketLoadResult> {
  const apiKey = getKicksApiKey();
  if (!apiKey) {
    return marketFromCachedCatalog(slug);
  }

  const productRes = await fetchStockxProduct(slug, apiKey);
  if (!productRes.ok) {
    // Inactive / exhausted free key → serve committed catalog instead of hard fail.
    if (productRes.status === 401 || productRes.status === 429) {
      const cached = marketFromCachedCatalog(slug);
      if (cached.ok) return cached;
    }
    if (productRes.status === 404) {
      return {
        ok: false,
        code: "not_found",
        error: `Sneaker "${slug}" was not found on StockX via KicksDB.`,
      };
    }
    const cached = marketFromCachedCatalog(slug);
    if (cached.ok) return cached;
    return {
      ok: false,
      code: "upstream",
      error: `StockX data request failed (${productRes.status}). ${productRes.body.slice(0, 180)}`,
    };
  }

  const product = productRes.data.data;
  const catalogFromList = await getSneakerBySlug(slug);
  const catalog =
    catalogFromList ??
    mapListedProductToCatalog(product) ??
    ({
      slug,
      ticker: slug.slice(0, 8).toUpperCase(),
      styleCode: product.sku || slug,
      name: product.title || slug,
      brand: product.brand || "Unknown",
      year: new Date().getUTCFullYear(),
      releaseDate: `${new Date().getUTCFullYear()}-01-01`,
      colorway: "—",
      retail: 0,
      stockxUrl: `https://stockx.com/${slug}`,
      fallbackImage: product.image || "",
      rank: product.rank ?? null,
    } satisfies SneakerCatalogEntry);

  let upstreamStatus: UpstreamStatus = productRes.cacheHit
    ? "cached"
    : "live";

  const local = resolveLocalHistory(catalog.slug);
  let historySource: HistorySource = local.source;
  let chartSeries = local.series;

  const salesRes = await fetchStockxDailySales(product.id, apiKey);
  if (salesRes.ok && (salesRes.data.data?.length ?? 0) > 1) {
    chartSeries = salesToSeries(salesRes.data.data ?? []);
    historySource = "sales";
  } else if (!salesRes.ok && salesRes.status !== 403) {
    upstreamStatus = productRes.cacheHit ? "cached" : "degraded";
  }

  const livePrice =
    product.min_price ??
    product.avg_price ??
    chartSeries.at(-1)?.price ??
    0;

  // Free-tier path: sales/daily is often 403 and many SKUs lack local
  // history files. Build an illustrative bootstrap series so every market
  // page still renders a TradingView chart.
  if (historySource !== "sales" && chartSeries.length < 2 && livePrice > 0) {
    const stats = product.statistics;
    chartSeries = buildBootstrapSeries({
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
    });
    historySource = "bootstrap";
  } else if (historySource !== "sales" && livePrice > 0) {
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
      catalog,
      chartSeries,
      historySource,
      upstreamStatus,
    }),
  };
}

export function getMarketFallback(catalog: SneakerCatalogEntry) {
  return emptyMarket(catalog);
}

export type ChangeMetric = {
  absolute: number;
  percent: number;
} | null;

export type VolumeMetric = {
  pairs: number;
  notional: number | null;
};

export type HistorySource =
  | "sales"
  | "snapshot"
  | "bootstrap"
  | "whole_market"
  | "hybrid";


export type UpstreamStatus = "live" | "degraded" | "cached" | "offline";

export type SizeAsk = {
  size: string;
  sizeType: string;
  lowestAsk: number | null;
  totalAsks: number;
  sales15d: number;
  sales30d: number;
  sales60d: number;
};

export type MarketStats = {
  lowestAsk: number | null;
  highestAsk: number | null;
  /** Highest bid when the upstream feed provides it; otherwise null. */
  highestBid: number | null;
  averageAsk: number | null;
  askCount: number;
  high24h: number | null;
  low24h: number | null;
  high30d: number | null;
  high30dSource: "sales" | "stockx_stats" | "snapshot" | null;
  low30d: number | null;
  low30dSource: "sales" | "stockx_stats" | "snapshot" | null;
  avgSale30d: number | null;
  avgSale30dSource: "sales" | "stockx_stats" | "snapshot" | null;
  lastSale: number | null;
  sales15d: number;
  sales30d: number;
  sales60d: number;
  weeklyOrders: number | null;
  rank: number | null;
  annualHigh: number | null;
  annualLow: number | null;
  annualAvg: number | null;
  annualVolatility: number | null;
  annualSales: number | null;
};

export type ChartPoint = {
  date: string;
  price: number;
  orders: number;
};

/** Active eBay listing comps (Browse API) — optional / feature-flagged. */
export type EbayListingComp = {
  itemId: string;
  title: string;
  price: number | null;
  currency: string;
  condition: string | null;
  url: string;
  shipping: number | null;
};

export type EbayComps = {
  status: "live" | "link_only" | "error";
  query: string;
  searchUrl: string;
  lowestAsk: number | null;
  medianAsk: number | null;
  listingCount: number;
  listings: EbayListingComp[];
  fetchedAt: string | null;
  error?: string;
};

export type SneakerMarket = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  year: number;
  ticker: string;
  styleCode: string;
  releaseDate: string;
  colorway: string;
  retail: number;
  image: string;
  stockxUrl: string;
  price: number;
  currency: "USD";
  changeToday: ChangeMetric;
  change30d: ChangeMetric;
  volume24h: VolumeMetric;
  volume24hSource: "sales" | "weekly_orders" | "snapshot";
  volume30d: VolumeMetric;
  volume30dSource: "sales" | "variant_sales" | "snapshot";
  stats: MarketStats;
  sizes: SizeAsk[];
  chartSeries: ChartPoint[];
  historySource: HistorySource;
  upstreamStatus: UpstreamStatus;
  source: "stockx";
  provider: "kicksdb";
  fetchedAt: string;
  historyAvailable: boolean;
  /** Present only when NEXT_PUBLIC_EBAY_PUBLIC is on. */
  ebay?: EbayComps | null;
};

export type MarketLoadResult =
  | { ok: true; data: SneakerMarket }
  | {
      ok: false;
      error: string;
      code: "missing_key" | "upstream" | "not_found";
    };

export type PriceAlert = {
  id: string;
  slug: string;
  ticker: string;
  name: string;
  direction: "above" | "below";
  threshold: number;
  webhookUrl?: string;
  createdAt: string;
};

/** Homepage market pulse — ChronoPulse-style basket index. */
export type MarketIndexFaq = {
  selection: string;
  calculation: string;
  updates: string;
};

export type MarketIndexBrand = {
  brand: string;
  models: number;
  weight: number;
};

export type MarketIndex = {
  name: string;
  ticker: string;
  level: number;
  liveLevel: number;
  historicalEndLevel: number | null;
  baseLevel: number;
  baseDate: string;
  asOf: string;
  changeToday: ChangeMetric;
  change30d: ChangeMetric;
  change90d: ChangeMetric;
  /** Full historical window change when long StockX contest series is present. */
  changeHistorical: ChangeMetric;
  peakLevel: number | null;
  peakDate: string | null;
  series: ChartPoint[];
  liveSeries: ChartPoint[];
  historicalSeries: ChartPoint[];
  constituents: number;
  historicalConstituents: number | null;
  brandCount: number | null;
  modelsPerBrand: number | null;
  brands: MarketIndexBrand[];
  rebalancedAt: string | null;
  nextRebalanceAt: string | null;
  historySource: HistorySource;
  methodology: string;
  howItWorks: MarketIndexFaq;
  citation: string | null;
  fetchedAt: string;
};

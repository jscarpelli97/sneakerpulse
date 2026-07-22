export type ChangeMetric = {
  absolute: number;
  percent: number;
} | null;

export type VolumeMetric = {
  pairs: number;
  notional: number | null;
};

export type HistorySource = "sales" | "snapshot" | "bootstrap";

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

export type SneakerMarket = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  year: number;
  ticker: string;
  styleCode: string;
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

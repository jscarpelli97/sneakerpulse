export type ChangeMetric = {
  absolute: number;
  percent: number;
} | null;

export type VolumeMetric = {
  pairs: number;
  notional: number | null;
};

export type MarketStats = {
  lowestAsk: number | null;
  highestAsk: number | null;
  averageAsk: number | null;
  askCount: number;
  high24h: number | null;
  low24h: number | null;
  high30d: number | null;
  low30d: number | null;
  avgSale30d: number | null;
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
  volume30d: VolumeMetric;
  stats: MarketStats;
  chartSeries: ChartPoint[];
  historySource: "sales" | "local";
  source: "stockx";
  provider: "kicksdb";
  fetchedAt: string;
  historyAvailable: boolean;
};

export type MarketLoadResult =
  | { ok: true; data: SneakerMarket }
  | { ok: false; error: string; code: "missing_key" | "upstream" | "not_found" };

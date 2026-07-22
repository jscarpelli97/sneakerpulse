export type ChangeMetric = {
  absolute: number;
  percent: number;
} | null;

export type VolumeMetric = {
  pairs: number;
  notional: number | null;
};

export type HistorySource = "sales" | "bootstrap";

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
  /** Present only when derived from StockX daily sales history. */
  high24h: number | null;
  /** Present only when derived from StockX daily sales history. */
  low24h: number | null;
  /** 30d sale high when sales history exists; otherwise StockX 90d range high. */
  high30d: number | null;
  high30dSource: "sales" | "stockx_stats" | null;
  /** 30d sale low when sales history exists; otherwise StockX 90d range low. */
  low30d: number | null;
  low30dSource: "sales" | "stockx_stats" | null;
  avgSale30d: number | null;
  avgSale30dSource: "sales" | "stockx_stats" | null;
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
  /** Headline price = live StockX lowest ask across sizes. */
  price: number;
  currency: "USD";
  /**
   * Day-over-day change from StockX daily average sale prices.
   * Null when sales history is unavailable (bootstrap chart does not drive this).
   */
  changeToday: ChangeMetric;
  /**
   * ~30-day change from StockX daily average sale prices.
   * Null when sales history is unavailable.
   */
  change30d: ChangeMetric;
  /**
   * When sales history exists: last 1 day of sale notional/pairs.
   * Otherwise: weekly order count only (pairs), notional null.
   */
  volume24h: VolumeMetric;
  volume24hSource: "sales" | "weekly_orders";
  volume30d: VolumeMetric;
  volume30dSource: "sales" | "variant_sales";
  stats: MarketStats;
  sizes: SizeAsk[];
  chartSeries: ChartPoint[];
  historySource: HistorySource;
  source: "stockx";
  provider: "kicksdb";
  fetchedAt: string;
  historyAvailable: boolean;
};

export type MarketLoadResult =
  | { ok: true; data: SneakerMarket }
  | { ok: false; error: string; code: "missing_key" | "upstream" | "not_found" };

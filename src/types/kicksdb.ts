export type KicksTrait = {
  trait: string;
  value: string;
};

export type KicksStatistics = {
  annual_high?: number;
  annual_low?: number;
  annual_range_high?: number;
  annual_range_low?: number;
  annual_average_price?: number;
  annual_volatility?: number;
  annual_sales_count?: number;
  last_90_days_range_high?: number;
  last_90_days_range_low?: number;
  last_90_days_average_price?: number;
  last_90_days_sales_count?: number;
};

export type KicksVariant = {
  size: string;
  size_type: string;
  lowest_ask: number | null;
  total_asks: number | null;
  hidden?: boolean;
  sales_count_15_days?: number;
  sales_count_30_days?: number;
  sales_count_60_days?: number;
};

export type KicksProduct = {
  id: string;
  title: string;
  brand: string;
  sku?: string;
  slug?: string;
  image?: string;
  link?: string;
  product_type?: string;
  category?: string;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
  weekly_orders?: number | null;
  rank?: number | null;
  traits?: KicksTrait[] | null;
  statistics?: KicksStatistics | null;
  variants?: KicksVariant[] | null;
};

export type KicksProductListResponse = {
  data: KicksProduct[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

export type KicksDailySale = {
  avg_amount: number;
  orders: number;
  date: string;
};

export type KicksFetchResult<T> =
  | { ok: true; data: T; cacheHit: boolean; status: number }
  | {
      ok: false;
      status: number;
      body: string;
      cacheHit: boolean;
    };

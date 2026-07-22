export type KicksStatistics = {
  annual_high?: number;
  annual_low?: number;
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
  image?: string;
  link?: string;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
  weekly_orders?: number | null;
  rank?: number | null;
  statistics?: KicksStatistics | null;
  variants?: KicksVariant[] | null;
};

export type KicksDailySale = {
  avg_amount: number;
  orders: number;
  date: string;
};

export type KicksFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; body: string };

const KICKS_BASE = "https://api.kicks.dev/v3";

export function getKicksApiKey() {
  return process.env.KICKSDB_API_KEY?.trim() || "";
}

export async function kicksFetch<T>(
  path: string,
  apiKey: string,
): Promise<KicksFetchResult<T>> {
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

export async function fetchStockxProduct(slug: string, apiKey: string) {
  const query = new URLSearchParams({
    "display[variants]": "true",
    "display[prices]": "true",
    "display[statistics]": "true",
    market: "US",
  });

  return kicksFetch<{ data: KicksProduct }>(
    `/stockx/products/${slug}?${query.toString()}`,
    apiKey,
  );
}

export async function fetchStockxDailySales(productId: string, apiKey: string) {
  return kicksFetch<{ data: KicksDailySale[] | null }>(
    `/stockx/products/${productId}/sales/daily?market=US`,
    apiKey,
  );
}

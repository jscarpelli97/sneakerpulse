import { cacheGet, cacheSet } from "@/lib/kicksdb/cache";
import { logFetch } from "@/lib/kicksdb/logger";

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
  | { ok: true; data: T; cacheHit: boolean; status: number }
  | {
      ok: false;
      status: number;
      body: string;
      cacheHit: boolean;
    };

const KICKS_BASE = "https://api.kicks.dev/v3";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function getKicksApiKey() {
  return process.env.KICKSDB_API_KEY?.trim() || "";
}

export async function kicksFetch<T>(
  path: string,
  apiKey: string,
  options?: { ttlMs?: number; bypassCache?: boolean },
): Promise<KicksFetchResult<T>> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const cacheKey = `kicks:${path}`;

  if (!options?.bypassCache) {
    const cached = cacheGet<T>(cacheKey);
    if (cached != null) {
      logFetch({ path, status: 200, cacheHit: true, ms: 0 });
      return { ok: true, data: cached, cacheHit: true, status: 200 };
    }
  }

  const started = Date.now();
  try {
    const response = await fetch(`${KICKS_BASE}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: Math.round(ttlMs / 1000) },
    });

    const body = await response.text();
    const ms = Date.now() - started;

    if (!response.ok) {
      logFetch({
        path,
        status: response.status,
        cacheHit: false,
        ms,
        detail: body.slice(0, 180),
      });
      return {
        ok: false,
        status: response.status,
        body,
        cacheHit: false,
      };
    }

    const data = JSON.parse(body) as T;
    cacheSet(cacheKey, data, ttlMs);
    logFetch({ path, status: response.status, cacheHit: false, ms });
    return { ok: true, data, cacheHit: false, status: response.status };
  } catch (error) {
    const ms = Date.now() - started;
    const detail = error instanceof Error ? error.message : "unknown error";
    logFetch({ path, status: "error", cacheHit: false, ms, detail });
    return {
      ok: false,
      status: 0,
      body: detail,
      cacheHit: false,
    };
  }
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
    { ttlMs: 15 * 60 * 1000 },
  );
}

import { cacheGet, cacheSet } from "@/lib/kicksdb/cache";
import { logFetch } from "@/lib/kicksdb/logger";
import { TOP_SELLERS_LIMIT } from "@/services/catalog/mapProductToCatalog";
import type {
  KicksDailySale,
  KicksFetchResult,
  KicksProduct,
  KicksProductListResponse,
} from "@/types/kicksdb";

export type {
  KicksDailySale,
  KicksFetchResult,
  KicksProduct,
  KicksProductListResponse,
  KicksStatistics,
  KicksVariant,
} from "@/types/kicksdb";

const KICKS_BASE = "https://api.kicks.dev/v3";
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const TOP_SELLERS_TTL_MS = 15 * 60 * 1000;

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

/**
 * Current top-selling StockX sneakers by sales rank (ascending rank = hotter).
 * Pages in chunks of 100 — KicksDB list endpoints commonly cap per_page there.
 */
export async function fetchTopStockxSneakers(
  apiKey: string,
  limit = TOP_SELLERS_LIMIT,
) {
  const pageSize = Math.min(100, Math.max(1, limit));
  const products: KicksProduct[] = [];
  let lastMeta: KicksProductListResponse["meta"];
  let lastCacheHit = false;
  let lastStatus = 200;

  for (let page = 1; products.length < limit && page <= 20; page += 1) {
    const query = new URLSearchParams({
      market: "US",
      limit: String(pageSize),
      page: String(page),
      sort: "rank",
      filters: 'product_type="sneakers"',
      "display[traits]": "true",
      "display[statistics]": "true",
    });

    const res = await kicksFetch<KicksProductListResponse>(
      `/stockx/products?${query.toString()}`,
      apiKey,
      { ttlMs: TOP_SELLERS_TTL_MS },
    );

    if (!res.ok) {
      if (products.length === 0) return res;
      break;
    }

    lastCacheHit = res.cacheHit;
    lastStatus = res.status;
    lastMeta = res.data.meta;
    const batch = res.data.data ?? [];
    if (!batch.length) break;
    products.push(...batch);
    if (batch.length < pageSize) break;
  }

  return {
    ok: true as const,
    data: {
      data: products.slice(0, limit),
      meta: {
        ...lastMeta,
        current_page: 1,
        per_page: limit,
        total: products.length,
      },
    },
    cacheHit: lastCacheHit,
    status: lastStatus,
  };
}

export async function fetchStockxDailySales(productId: string, apiKey: string) {
  return kicksFetch<{ data: KicksDailySale[] | null }>(
    `/stockx/products/${productId}/sales/daily?market=US`,
    apiKey,
    { ttlMs: 15 * 60 * 1000 },
  );
}

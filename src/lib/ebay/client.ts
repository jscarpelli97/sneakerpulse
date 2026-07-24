/**
 * Official eBay Browse API client (active listing asks).
 * Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
 * Auth: OAuth2 client_credentials + Basic (clientId:clientSecret)
 */

import { cacheGet, cacheSet } from "@/lib/kicksdb/cache";
import { getEbayCredentials } from "@/lib/ebay/config";
import { EBAY_ATHLETIC_SHOES_CATEGORY } from "@/lib/ebay/searchUrl";

const TOKEN_TTL_MS = 110 * 60 * 1000; // ~2h tokens; refresh early
const SEARCH_TTL_MS = 10 * 60 * 1000;

type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type EbayItemSummary = {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  condition?: string;
  price?: { value?: string; currency?: string };
  shippingOptions?: Array<{
    shippingCost?: { value?: string; currency?: string };
  }>;
  buyingOptions?: string[];
};

export type EbaySearchResponse = {
  total?: number;
  itemSummaries?: EbayItemSummary[];
};

function apiBase(sandbox: boolean) {
  return sandbox
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

async function getAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; error: string; status: number }
> {
  const creds = getEbayCredentials();
  if (!creds) {
    return { ok: false, error: "eBay credentials not configured", status: 503 };
  }

  const cacheKey = `ebay:token:${creds.sandbox ? "sbx" : "prod"}:${creds.clientId}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return { ok: true, token: cached };

  const basic = Buffer.from(
    `${creds.clientId}:${creds.clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${apiBase(creds.sandbox)}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: `eBay OAuth failed (${response.status}): ${body.slice(0, 180)}`,
      status: response.status,
    };
  }

  const data = JSON.parse(body) as EbayTokenResponse;
  const ttlMs = Math.min(
    TOKEN_TTL_MS,
    Math.max(60_000, (data.expires_in ?? 7200) * 1000 - 60_000),
  );
  cacheSet(cacheKey, data.access_token, ttlMs);
  return { ok: true, token: data.access_token };
}

export async function searchEbayItemSummaries(input: {
  query: string;
  limit?: number;
}): Promise<
  | { ok: true; data: EbaySearchResponse; cacheHit: boolean }
  | { ok: false; error: string; status: number }
> {
  const creds = getEbayCredentials();
  if (!creds) {
    return { ok: false, error: "eBay credentials not configured", status: 503 };
  }

  const q = input.query.trim();
  if (!q) {
    return { ok: false, error: "Missing eBay search query", status: 400 };
  }

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const cacheKey = `ebay:search:${creds.marketplaceId}:${limit}:${q.toLowerCase()}`;
  const cached = cacheGet<EbaySearchResponse>(cacheKey);
  if (cached) return { ok: true, data: cached, cacheHit: true };

  const tokenRes = await getAccessToken();
  if (!tokenRes.ok) return tokenRes;

  const url = new URL(
    `${apiBase(creds.sandbox)}/buy/browse/v1/item_summary/search`,
  );
  url.searchParams.set("q", q);
  url.searchParams.set("category_ids", EBAY_ATHLETIC_SHOES_CATEGORY);
  url.searchParams.set("limit", String(limit));
  // New + Buy It Now — closer to secondary-market asks than auctions/used.
  url.searchParams.set(
    "filter",
    "conditions:{NEW},buyingOptions:{FIXED_PRICE}",
  );
  url.searchParams.set("sort", "price");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${tokenRes.token}`,
      "X-EBAY-C-MARKETPLACE-ID": creds.marketplaceId,
    },
    next: { revalidate: Math.round(SEARCH_TTL_MS / 1000) },
  });

  const body = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: `eBay Browse search failed (${response.status}): ${body.slice(0, 180)}`,
      status: response.status,
    };
  }

  const data = JSON.parse(body) as EbaySearchResponse;
  cacheSet(cacheKey, data, SEARCH_TTL_MS);
  return { ok: true, data, cacheHit: false };
}

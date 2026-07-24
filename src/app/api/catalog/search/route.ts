import { NextResponse } from "next/server";
import {
  getKicksApiKey,
  searchStockxProducts,
} from "@/lib/kicksdb/client";
import { kicksLiveReadsEnabled } from "@/lib/dataMode";
import { mapListedProductToCatalog } from "@/services/catalog/mapProductToCatalog";
import {
  rememberProductLater,
  searchDiscovered,
} from "@/services/catalog/discoveredProducts";
import { getOfflineCatalogQuotes } from "@/services/catalog/offlineCatalog";

export const dynamic = "force-dynamic";

export type CatalogSearchHit = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  fallbackImage: string;
  price: number | null;
  retail: number;
  source: "live" | "snapshot";
};

function scoreOfflineHit(
  row: {
    name: string;
    brand: string;
    styleCode: string;
    ticker: string;
    slug: string;
    colorway?: string;
  },
  tokens: string[],
) {
  const hay = [
    row.name,
    row.brand,
    row.styleCode,
    row.ticker,
    row.slug,
    row.colorway,
  ]
    .join(" ")
    .toLowerCase();
  if (!tokens.every((token) => hay.includes(token))) return null;
  let score = tokens.length * 10;
  if (row.name.toLowerCase().includes(tokens.join(" "))) score += 20;
  for (const token of tokens) {
    if (row.name.toLowerCase().includes(token)) score += 3;
    if (row.slug.toLowerCase().includes(token)) score += 1;
  }
  return score;
}

async function filterLocal(query: string, limit: number): Promise<CatalogSearchHit[]> {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const scored: Array<{ row: CatalogSearchHit; score: number }> = [];
  const seen = new Set<string>();

  for (const row of getOfflineCatalogQuotes()) {
    const score = scoreOfflineHit(row, tokens);
    if (score == null || seen.has(row.slug)) continue;
    seen.add(row.slug);
    scored.push({
      row: {
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        ticker: row.ticker,
        styleCode: row.styleCode,
        fallbackImage: row.fallbackImage,
        price: row.price ?? null,
        retail: row.retail,
        source: "snapshot",
      },
      score,
    });
  }

  for (const row of await searchDiscovered(query, limit * 2)) {
    const score = scoreOfflineHit(row, tokens);
    if (score == null || seen.has(row.slug)) continue;
    seen.add(row.slug);
    scored.push({
      row: {
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        ticker: row.ticker,
        styleCode: row.styleCode,
        fallbackImage: row.fallbackImage,
        price: row.price ?? null,
        retail: row.retail,
        source: "snapshot",
      },
      score: score + 5, // Prefer previously looked-up pairs slightly.
    });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.row);
}

/**
 * Typeahead search for sneakers (Wardrobe / Portfolio / Markets / header).
 * Offline snapshot + discovered DB by default. Live KicksDB only when
 * KICKSDB_LIVE_READS=1 — and those hits are persisted for reuse.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    24,
    Math.max(1, Number(searchParams.get("limit") ?? "16") || 16),
  );

  if (q.length < 2) {
    return NextResponse.json({
      ok: true,
      data: [] as CatalogSearchHit[],
      meta: { query: q, source: "empty" },
    });
  }

  const apiKey = getKicksApiKey();
  if (apiKey && kicksLiveReadsEnabled()) {
    const res = await searchStockxProducts(apiKey, q, limit);
    if (res.ok) {
      const data: CatalogSearchHit[] = [];
      const seen = new Set<string>();
      for (const product of res.data.data ?? []) {
        const entry = mapListedProductToCatalog(product);
        if (!entry || seen.has(entry.slug)) continue;
        seen.add(entry.slug);
        const hit: CatalogSearchHit = {
          slug: entry.slug,
          name: entry.name,
          brand: entry.brand,
          ticker: entry.ticker,
          styleCode: entry.styleCode,
          fallbackImage: entry.fallbackImage,
          price:
            typeof product.min_price === "number" ? product.min_price : null,
          retail: entry.retail,
          source: "live",
        };
        data.push(hit);
        rememberProductLater({
          ...entry,
          price: hit.price,
          weeklyOrders: product.weekly_orders ?? null,
          source: "search",
        });
        if (data.length >= limit) break;
      }
      return NextResponse.json({
        ok: true,
        data,
        meta: {
          query: q,
          source: "live",
          cacheHit: res.cacheHit,
        },
      });
    }
  }

  const offline = await filterLocal(q, limit);
  return NextResponse.json({
    ok: true,
    data: offline,
    meta: {
      query: q,
      source:
        apiKey && kicksLiveReadsEnabled()
          ? "snapshot-fallback"
          : "snapshot",
    },
  });
}

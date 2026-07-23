import { NextResponse } from "next/server";
import {
  getKicksApiKey,
  searchStockxProducts,
} from "@/lib/kicksdb/client";
import { mapListedProductToCatalog } from "@/services/catalog/mapProductToCatalog";
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

function filterOffline(query: string, limit: number): CatalogSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return getOfflineCatalogQuotes()
    .filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.brand.toLowerCase().includes(q) ||
        row.styleCode.toLowerCase().includes(q) ||
        row.ticker.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q),
    )
    .slice(0, limit)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      ticker: row.ticker,
      styleCode: row.styleCode,
      fallbackImage: row.fallbackImage,
      price: row.price ?? null,
      retail: row.retail,
      source: "snapshot" as const,
    }));
}

/**
 * Typeahead search for sneakers (Wardrobe / Portfolio add flows).
 * Live KicksDB `query` when keyed; falls back to offline top-seller snapshot.
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
  if (apiKey) {
    const res = await searchStockxProducts(apiKey, q, limit);
    if (res.ok) {
      const data: CatalogSearchHit[] = [];
      const seen = new Set<string>();
      for (const product of res.data.data ?? []) {
        const entry = mapListedProductToCatalog(product);
        if (!entry || seen.has(entry.slug)) continue;
        seen.add(entry.slug);
        data.push({
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

  const offline = filterOffline(q, limit);
  return NextResponse.json({
    ok: true,
    data: offline,
    meta: {
      query: q,
      source: apiKey ? "snapshot-fallback" : "snapshot",
    },
  });
}

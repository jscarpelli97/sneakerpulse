import { NextResponse } from "next/server";
import { upsertDiscoveredProduct } from "@/services/catalog/discoveredProducts";

export const dynamic = "force-dynamic";

/**
 * Persist a pair the user actually selected from search so it can be reused
 * site-wide without another KicksDB pull.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const row = body as {
    slug?: string;
    name?: string;
    brand?: string;
    ticker?: string;
    styleCode?: string;
    fallbackImage?: string;
    price?: number | null;
    retail?: number | null;
  };

  if (!row.slug?.trim() || !row.name?.trim()) {
    return NextResponse.json(
      { ok: false, error: "slug and name are required" },
      { status: 400 },
    );
  }

  const saved = await upsertDiscoveredProduct({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    ticker: row.ticker,
    styleCode: row.styleCode,
    fallbackImage: row.fallbackImage,
    price: row.price ?? null,
    retail: row.retail ?? null,
    source: "remember",
  });

  if (!saved) {
    return NextResponse.json(
      { ok: false, error: "Could not save pair" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { slug: saved.slug } });
}

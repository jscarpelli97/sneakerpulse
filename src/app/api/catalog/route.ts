import { NextResponse } from "next/server";
import { gateCatalogRows, getPlusAccess } from "@/lib/plus/access";
import { getCatalogQuotes } from "@/services/market/getCatalogQuotes";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ isPlus }, quotes] = await Promise.all([
    getPlusAccess(),
    getCatalogQuotes(),
  ]);
  const access = gateCatalogRows(quotes, isPlus);
  return NextResponse.json({
    ok: true,
    data: access.rows,
    meta: {
      isPlus: access.isPlus,
      gated: access.gated,
      visible: access.visible,
      total: access.total,
      freeLimit: access.freeLimit,
    },
    fetchedAt: new Date().toISOString(),
  });
}

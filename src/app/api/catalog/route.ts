import { NextResponse } from "next/server";
import { getCatalogQuotes } from "@/lib/market/getCatalogQuotes";

export const revalidate = 300;

export async function GET() {
  const quotes = await getCatalogQuotes();
  return NextResponse.json({
    ok: true,
    data: quotes,
    fetchedAt: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import {
  getPortfolioSizeAsks,
  type PortfolioAskLine,
} from "@/services/portfolio/getPortfolioSizeAsks";

export const dynamic = "force-dynamic";

type Body = {
  holdings?: PortfolioAskLine[];
};

/**
 * Live size asks for Portfolio holdings.
 * Ignores KICKSDB_LIVE_READS — board stays on snapshot; owned pairs hit KicksDB.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const holdings = Array.isArray(body.holdings) ? body.holdings : [];
  const cleaned: PortfolioAskLine[] = [];
  const seen = new Set<string>();

  for (const row of holdings.slice(0, 50)) {
    const id = String(row?.id ?? "").trim();
    const slug = String(row?.slug ?? "").trim();
    const size = String(row?.size ?? "").trim();
    if (!id || !slug) continue;
    const key = `${id}:${slug}:${size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ id, slug, size: size || "—" });
  }

  if (!cleaned.length) {
    return NextResponse.json({ data: [], live: false });
  }

  const data = await getPortfolioSizeAsks(cleaned);
  const liveCount = data.filter((row) => row.live).length;

  return NextResponse.json({
    data,
    live: liveCount > 0,
    liveCount,
    total: data.length,
  });
}

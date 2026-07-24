import { NextResponse } from "next/server";
import { getLiveSizeLadder } from "@/services/market/getLiveSizeLadder";

export const dynamic = "force-dynamic";

/**
 * Live per-size asks for Deal check (and similar tools).
 * Bypasses KICKSDB_LIVE_READS — board stays on snapshot; Deal hits KicksDB once per slug.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await context.params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  }

  const ladder = await getLiveSizeLadder(slug);
  return NextResponse.json({
    ok: true,
    data: {
      slug: ladder.slug,
      sizes: ladder.sizes,
      marketPrice: ladder.marketPrice,
      statsLowestAsk: ladder.statsLowestAsk,
      live: ladder.live,
    },
  });
}

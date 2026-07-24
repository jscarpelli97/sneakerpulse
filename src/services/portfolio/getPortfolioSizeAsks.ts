import {
  resolveHoldingAsk,
  type HoldingAskSource,
} from "@/lib/portfolio/resolveHoldingAsk";
import { resolveCatalogQuoteBySlug } from "@/services/catalog/discoveredProducts";
import { getLiveSizeLadder } from "@/services/market/getLiveSizeLadder";

export type PortfolioAskLine = {
  id: string;
  slug: string;
  size: string;
};

export type PortfolioAskResult = {
  id: string;
  slug: string;
  size: string;
  ask: number | null;
  source: HoldingAskSource;
  /** True when this ask came from a live KicksDB product pull (or cache of one). */
  live: boolean;
};

/**
 * Live size asks for Portfolio holdings only.
 * Bypasses KICKSDB_LIVE_READS so the board can stay on the daily snapshot
 * while owned pairs still mark to StockX size asks (1 product call / slug).
 */
export async function getPortfolioSizeAsks(
  lines: PortfolioAskLine[],
): Promise<PortfolioAskResult[]> {
  if (!lines.length) return [];

  const uniqueSlugs = [
    ...new Set(lines.map((line) => line.slug).filter(Boolean)),
  ];
  const ladders = new Map(
    await Promise.all(
      uniqueSlugs.map(
        async (slug) => [slug, await getLiveSizeLadder(slug)] as const,
      ),
    ),
  );

  return Promise.all(
    lines.map(async (line) => {
      const ladder = ladders.get(line.slug);
      const offline = await resolveCatalogQuoteBySlug(line.slug);
      const resolved = resolveHoldingAsk({
        holdingSize: line.size,
        sizes: ladder?.sizes,
        catalogPrice: offline?.price ?? null,
        marketPrice: ladder?.marketPrice ?? null,
        statsLowestAsk: ladder?.statsLowestAsk ?? null,
      });
      return {
        id: line.id,
        slug: line.slug,
        size: line.size,
        ask: resolved.ask,
        source: resolved.source,
        live: Boolean(ladder?.live && resolved.source === "size"),
      };
    }),
  );
}

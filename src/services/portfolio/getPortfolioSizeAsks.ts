import { fetchStockxProduct, getKicksApiKey } from "@/lib/kicksdb/client";
import {
  resolveHoldingAsk,
  type HoldingAskSource,
} from "@/lib/portfolio/resolveHoldingAsk";
import { resolveCatalogQuoteBySlug } from "@/services/catalog/sneakers";
import { mapProductToMarket } from "@/services/market/mapProductToMarket";
import type { SizeAsk } from "@/types/market";

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

type LadderCache = {
  sizes: SizeAsk[];
  marketPrice: number | null;
  statsLowestAsk: number | null;
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

  const apiKey = getKicksApiKey();
  const uniqueSlugs = [...new Set(lines.map((line) => line.slug).filter(Boolean))];
  const ladders = new Map<string, LadderCache>();

  await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const offline = await resolveCatalogQuoteBySlug(slug);
      const catalogFallback = {
        slug,
        ticker: offline?.ticker ?? slug.slice(0, 8).toUpperCase(),
        styleCode: offline?.styleCode ?? slug,
        name: offline?.name ?? slug,
        brand: offline?.brand ?? "Unknown",
        year: offline?.year ?? new Date().getUTCFullYear(),
        releaseDate: offline?.releaseDate ?? `${new Date().getUTCFullYear()}-01-01`,
        colorway: offline?.colorway ?? "—",
        retail: offline?.retail ?? 0,
        stockxUrl: offline?.stockxUrl ?? `https://stockx.com/${slug}`,
        fallbackImage: offline?.fallbackImage ?? "",
      };

      if (!apiKey) {
        ladders.set(slug, {
          sizes: [],
          marketPrice: offline?.price ?? null,
          statsLowestAsk: offline?.price ?? null,
          live: false,
        });
        return;
      }

      const productRes = await fetchStockxProduct(slug, apiKey);
      if (!productRes.ok || !productRes.data?.data) {
        ladders.set(slug, {
          sizes: [],
          marketPrice: offline?.price ?? null,
          statsLowestAsk: offline?.price ?? null,
          live: false,
        });
        return;
      }

      const product = productRes.data.data;
      const market = mapProductToMarket({
        product,
        catalog: catalogFallback,
        chartSeries: [],
        historySource: "bootstrap",
        upstreamStatus: productRes.cacheHit ? "cached" : "live",
      });

      ladders.set(slug, {
        sizes: market.sizes,
        marketPrice: market.price > 0 ? market.price : null,
        statsLowestAsk:
          market.stats.lowestAsk != null && market.stats.lowestAsk > 0
            ? market.stats.lowestAsk
            : null,
        live: !productRes.cacheHit || market.sizes.length > 0,
      });
    }),
  );

  return await Promise.all(
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

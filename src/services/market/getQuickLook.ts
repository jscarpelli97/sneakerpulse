import { buildMarketSummary } from "@/lib/summary/buildMarketSummary";
import { HOMEPAGE_WATCHLIST_LIMIT } from "@/services/catalog/mapProductToCatalog";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import { getMarketBySlug } from "@/services/market/getMarketBySlug";
import type { MarketTone } from "@/types/summary";
import { premiumVsRetail } from "@/utils/metrics";

export type QuickLookKind = "best_value" | "bullish" | "bearish" | "mixed";

export type QuickLookPick = {
  kind: QuickLookKind;
  slug: string;
  name: string;
  ticker: string;
  brand: string;
  image: string;
  price: number | null;
  retail: number;
  weeklyOrders: number | null;
  rank: number | null;
  tone: MarketTone;
  headline: string;
  detail: string;
  metricLabel: string;
  source: "rules" | "value_screen";
};

export type MarketsQuickLook = {
  picks: QuickLookPick[];
  scanned: number;
  generatedAt: string;
};

const MIN_ORDERS_FOR_VALUE = 200;
const TONE_SCAN_LIMIT = 24;

function valueScore(quote: CatalogQuote): number | null {
  if (quote.price == null || !(quote.retail > 0) || quote.price <= 0) {
    return null;
  }
  const premium = premiumVsRetail(quote.price, quote.retail);
  if (!premium) return null;
  const orders = Math.max(1, quote.weeklyOrders ?? 0);
  if (orders < MIN_ORDERS_FOR_VALUE && premium.percent >= 0) return null;
  const discount = -premium.percent;
  const liquidity = Math.log10(orders + 10);
  return discount * liquidity;
}

function pickBestValue(quotes: CatalogQuote[]): QuickLookPick | null {
  let best: { quote: CatalogQuote; score: number; premiumPct: number } | null =
    null;
  for (const quote of quotes) {
    const score = valueScore(quote);
    if (score == null) continue;
    const premium = premiumVsRetail(quote.price, quote.retail);
    if (!premium) continue;
    if (!best || score > best.score) {
      best = { quote, score, premiumPct: premium.percent };
    }
  }
  if (!best) return null;
  const { quote, premiumPct } = best;
  const under = premiumPct < 0;
  return {
    kind: "best_value",
    slug: quote.slug,
    name: quote.name,
    ticker: quote.ticker,
    brand: quote.brand,
    image: quote.fallbackImage,
    price: quote.price,
    retail: quote.retail,
    weeklyOrders: quote.weeklyOrders,
    rank: quote.rank,
    tone: under ? "bullish" : "mixed",
    headline: under ? "Best value vs retail" : "Closest to fair retail",
    detail: under
      ? "Lowest ask sits under retail with enough weekly flow to trade."
      : "Among liquid names, this ask is nearest to retail.",
    metricLabel: `${premiumPct >= 0 ? "+" : ""}${premiumPct.toFixed(1)}% vs retail`,
    source: "value_screen",
  };
}

function toneStrength(changePercent: number | null, weeklyOrders: number | null) {
  const move = Math.abs(changePercent ?? 0);
  const orders = Math.log10((weeklyOrders ?? 0) + 10);
  return move * 0.7 + orders * 0.3;
}

function fromQuote(
  quote: CatalogQuote,
  kind: Exclude<QuickLookKind, "best_value">,
  tone: MarketTone,
  headline: string,
  detail: string,
): QuickLookPick | null {
  const premium = premiumVsRetail(quote.price, quote.retail);
  if (!premium || quote.price == null) return null;
  return {
    kind,
    slug: quote.slug,
    name: quote.name,
    ticker: quote.ticker,
    brand: quote.brand,
    image: quote.fallbackImage,
    price: quote.price,
    retail: quote.retail,
    weeklyOrders: quote.weeklyOrders,
    rank: quote.rank,
    tone,
    headline,
    detail,
    metricLabel: `${premium.percent >= 0 ? "+" : ""}${premium.percent.toFixed(1)}% vs retail`,
    source: "value_screen",
  };
}

/**
 * Homepage / markets “Quick look”: best value screen + rule-engine tones
 * over a small top-seller sample (no extra paid APIs).
 */
export async function getQuickLook(
  quotes: CatalogQuote[],
): Promise<MarketsQuickLook> {
  const ranked = [...quotes].sort(
    (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999),
  );
  const sample = ranked.slice(
    0,
    Math.max(TONE_SCAN_LIMIT, HOMEPAGE_WATCHLIST_LIMIT),
  );

  const bestValue = pickBestValue(ranked);
  const toneBest = new Map<
    "bullish" | "bearish" | "mixed",
    { pick: QuickLookPick; strength: number }
  >();

  const results = await Promise.all(
    sample.map(async (quote) => {
      const market = await getMarketBySlug(quote.slug);
      if (!market.ok) return null;

      const trusted =
        market.data.historySource === "sales" ||
        market.data.historySource === "snapshot";
      // Skip bootstrap-only tapes — synthetic paths are not investment signal.
      if (!trusted) return null;

      const summary = buildMarketSummary(market.data);
      if (
        summary.tone !== "bullish" &&
        summary.tone !== "bearish" &&
        summary.tone !== "mixed"
      ) {
        return null;
      }

      const premium = premiumVsRetail(market.data.price, market.data.retail);
      const change = summary.signals.priceChangePercent;
      const pick: QuickLookPick = {
        kind: summary.tone,
        slug: market.data.slug,
        name: market.data.name,
        ticker: market.data.ticker,
        brand: market.data.brand,
        image: market.data.image,
        price: market.data.price,
        retail: market.data.retail,
        weeklyOrders: market.data.stats.weeklyOrders,
        rank: market.data.stats.rank,
        tone: summary.tone,
        headline: summary.headline,
        detail: summary.body,
        metricLabel:
          change != null
            ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}% tape`
            : premium
              ? `${premium.percent >= 0 ? "+" : ""}${premium.percent.toFixed(1)}% vs retail`
              : summary.tone,
        source: "rules",
      };
      return {
        pick,
        strength: toneStrength(change, market.data.stats.weeklyOrders),
      };
    }),
  );

  for (const row of results) {
    if (!row) continue;
    const key = row.pick.kind as "bullish" | "bearish" | "mixed";
    const existing = toneBest.get(key);
    if (!existing || row.strength > existing.strength) {
      toneBest.set(key, row);
    }
  }

  if (!toneBest.has("bullish")) {
    const under = ranked
      .filter(
        (q) =>
          q.price != null &&
          q.retail > 0 &&
          q.price < q.retail &&
          (q.weeklyOrders ?? 0) >= MIN_ORDERS_FOR_VALUE,
      )
      .sort((a, b) => a.price! / a.retail - b.price! / b.retail)[0];
    const pick = under
      ? fromQuote(
          under,
          "bullish",
          "bullish",
          "Under retail with real flow",
          "Ask sits below retail while weekly orders stay healthy — a simple bullish value setup.",
        )
      : null;
    if (pick) toneBest.set("bullish", { pick, strength: 0 });
  }

  if (!toneBest.has("bearish")) {
    const rich = ranked
      .filter(
        (q) =>
          q.price != null &&
          q.retail > 0 &&
          q.price > q.retail * 1.25 &&
          (q.weeklyOrders ?? 0) >= MIN_ORDERS_FOR_VALUE,
      )
      .sort((a, b) => b.price! / b.retail - a.price! / a.retail)[0];
    const pick = rich
      ? fromQuote(
          rich,
          "bearish",
          "bearish",
          "Stretched premium vs retail",
          "Ask is well above retail on a liquid name — premium risk if the bid cools.",
        )
      : null;
    if (pick) toneBest.set("bearish", { pick, strength: 0 });
  }

  if (!toneBest.has("mixed")) {
    const near = ranked
      .filter(
        (q) =>
          q.price != null &&
          q.retail > 0 &&
          Math.abs(q.price / q.retail - 1) < 0.08 &&
          (q.weeklyOrders ?? 0) >= MIN_ORDERS_FOR_VALUE,
      )
      .sort((a, b) => (b.weeklyOrders ?? 0) - (a.weeklyOrders ?? 0))[0];
    const pick = near
      ? fromQuote(
          near,
          "mixed",
          "mixed",
          "Trading near retail",
          "Liquid name pinned close to retail — balanced setup without a clear premium or discount.",
        )
      : null;
    if (pick) toneBest.set("mixed", { pick, strength: 0 });
  }

  const picks: QuickLookPick[] = [];
  if (bestValue) picks.push(bestValue);
  for (const key of ["bullish", "bearish", "mixed"] as const) {
    const hit = toneBest.get(key)?.pick;
    if (hit) picks.push(hit);
  }

  return {
    picks,
    scanned: sample.length,
    generatedAt: new Date().toISOString(),
  };
}

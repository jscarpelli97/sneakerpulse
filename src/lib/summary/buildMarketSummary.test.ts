import { describe, expect, it } from "vitest";
import {
  buildMarketSummary,
  deriveMarketSignals,
} from "@/lib/summary/buildMarketSummary";
import type { MarketStats, SneakerMarket } from "@/types/market";

const defaultStats: MarketStats = {
  lowestAsk: 200,
  highestAsk: 400,
  highestBid: null,
  averageAsk: 250,
  askCount: 40,
  high24h: null,
  low24h: null,
  high30d: null,
  high30dSource: null,
  low30d: null,
  low30dSource: null,
  avgSale30d: null,
  avgSale30dSource: null,
  lastSale: null,
  sales15d: 10,
  sales30d: 20,
  sales60d: 40,
  weeklyOrders: 50,
  rank: 100,
  annualHigh: null,
  annualLow: null,
  annualAvg: null,
  annualVolatility: null,
  annualSales: null,
};

function baseMarket(
  overrides: Partial<Omit<SneakerMarket, "stats">> & {
    stats?: Partial<MarketStats>;
  } = {},
): SneakerMarket {
  const { stats: statsOverrides, ...rest } = overrides;
  return {
    id: "1",
    slug: "test",
    name: "Test Shoe",
    brand: "Test",
    year: 2020,
    ticker: "TEST",
    styleCode: "TEST-1",
    releaseDate: "2020-01-01",
    colorway: "Black",
    retail: 100,
    image: "https://example.com/x.jpg",
    stockxUrl: "https://stockx.com/test",
    price: 200,
    currency: "USD",
    changeToday: null,
    change30d: null,
    volume24h: { pairs: 0, notional: null },
    volume24hSource: "weekly_orders",
    volume30d: { pairs: 0, notional: null },
    volume30dSource: "variant_sales",
    sizes: [],
    chartSeries: [],
    historySource: "snapshot",
    upstreamStatus: "live",
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: new Date().toISOString(),
    historyAvailable: false,
    ...rest,
    stats: { ...defaultStats, ...statsOverrides },
  };
}

describe("deriveMarketSignals", () => {
  it("marks price up and inventory down when asks are scarce vs orders", () => {
    const signals = deriveMarketSignals(
      baseMarket({
        change30d: { absolute: 20, percent: 10 },
        stats: { askCount: 20, weeklyOrders: 80 },
      }),
    );
    expect(signals.price).toBe("up");
    expect(signals.inventory).toBe("down");
  });

  it("marks price down and inventory up when asks are heavy vs orders", () => {
    const signals = deriveMarketSignals(
      baseMarket({
        change30d: { absolute: -15, percent: -8 },
        stats: { askCount: 200, weeklyOrders: 40 },
      }),
    );
    expect(signals.price).toBe("down");
    expect(signals.inventory).toBe("up");
  });
});

describe("buildMarketSummary", () => {
  it("uses the demand-up supply-tight narrative", () => {
    const summary = buildMarketSummary(
      baseMarket({
        change30d: { absolute: 20, percent: 10 },
        stats: { askCount: 20, weeklyOrders: 80 },
      }),
    );
    expect(summary.ruleId).toBe("price-up-inventory-down");
    expect(summary.body).toBe(
      "Demand appears to be increasing while supply is tightening.",
    );
    expect(summary.generator).toBe("rules");
    expect(summary.tone).toBe("bullish");
  });

  it("uses the weakening-supply narrative", () => {
    const summary = buildMarketSummary(
      baseMarket({
        change30d: { absolute: -15, percent: -8 },
        stats: { askCount: 200, weeklyOrders: 40 },
      }),
    );
    expect(summary.ruleId).toBe("price-down-inventory-up");
    expect(summary.body).toBe(
      "The market appears to be weakening due to increased supply.",
    );
    expect(summary.tone).toBe("bearish");
  });
});

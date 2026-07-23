import { describe, expect, it } from "vitest";
import { evaluateDeal } from "@/lib/deal/evaluateDeal";
import type { SneakerMarket } from "@/types/market";

function market(partial: Partial<SneakerMarket> = {}): SneakerMarket {
  return {
    id: "1",
    slug: "test-pair",
    name: "Test Pair",
    brand: "Jordan",
    year: 2026,
    ticker: "FQ8138-600",
    styleCode: "FQ8138-600",
    releaseDate: "2026-01-01",
    colorway: "Red",
    retail: 220,
    image: "https://example.com/x.jpg",
    stockxUrl: "https://stockx.com/test-pair",
    price: 200,
    currency: "USD",
    changeToday: null,
    change30d: null,
    volume24h: { pairs: 10, notional: null },
    volume24hSource: "weekly_orders",
    volume30d: { pairs: 50, notional: null },
    volume30dSource: "sales",
    chartSeries: [],
    historySource: "snapshot",
    historyAvailable: true,
    sizes: [
      {
        size: "12",
        sizeType: "us m",
        lowestAsk: 210,
        totalAsks: 4,
        sales15d: 1,
        sales30d: 3,
        sales60d: 6,
      },
    ],
    stats: {
      lowestAsk: 200,
      highestAsk: 400,
      highestBid: null,
      averageAsk: 250,
      askCount: 40,
      high24h: null,
      low24h: null,
      high30d: 260,
      high30dSource: "snapshot",
      low30d: 180,
      low30dSource: "snapshot",
      avgSale30d: 205,
      avgSale30dSource: "snapshot",
      lastSale: 198,
      sales15d: 20,
      sales30d: 50,
      sales60d: 100,
      weeklyOrders: 120,
      rank: 2,
      annualHigh: null,
      annualLow: null,
      annualAvg: null,
      annualVolatility: null,
      annualSales: null,
    },
    upstreamStatus: "cached",
    source: "stockx",
    provider: "kicksdb",
    fetchedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("evaluateDeal", () => {
  it("returns null for invalid offer", () => {
    expect(evaluateDeal(market(), 0)).toBeNull();
    expect(evaluateDeal(market(), -10)).toBeNull();
  });

  it("flags under-ask under-retail as buy", () => {
    const result = evaluateDeal(market(), 175);
    expect(result?.verdict).toBe("buy");
    expect(result?.comps.some((c) => c.id === "ask")).toBe(true);
  });

  it("flags well above ask as pass", () => {
    const result = evaluateDeal(market(), 280);
    expect(result?.verdict).toBe("pass");
  });

  it("uses size ask when provided", () => {
    const result = evaluateDeal(market(), 210, market().sizes[0]);
    expect(result?.sizeLabel).toBe("12");
    expect(result?.ask).toBe(210);
    expect(result?.comps.find((c) => c.id === "ask")?.label).toContain("12");
  });

  it("returns stretch slightly above the ask", () => {
    const result = evaluateDeal(market(), 230);
    expect(result?.verdict).toBe("stretch");
  });
});

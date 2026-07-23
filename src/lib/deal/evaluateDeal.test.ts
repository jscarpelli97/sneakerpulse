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
      {
        size: "9",
        sizeType: "us m",
        lowestAsk: 185,
        totalAsks: 8,
        sales15d: 4,
        sales30d: 10,
        sales60d: 18,
      },
    ],
    stats: {
      lowestAsk: 185,
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

const size12 = () => market().sizes[0];
const size9 = () => market().sizes[1];

describe("evaluateDeal", () => {
  it("returns null for invalid offer or missing size", () => {
    expect(evaluateDeal(market(), 0, size12())).toBeNull();
    expect(evaluateDeal(market(), 200, null)).toBeNull();
    expect(evaluateDeal(market(), 200)).toBeNull();
  });

  it("flags under size-ask under-retail as buy", () => {
    const result = evaluateDeal(market(), 175, size12());
    expect(result?.verdict).toBe("buy");
    expect(result?.ask).toBe(210);
    expect(result?.comps.find((c) => c.id === "ask")?.label).toContain("12");
  });

  it("flags well above size ask as pass", () => {
    const result = evaluateDeal(market(), 280, size12());
    expect(result?.verdict).toBe("pass");
  });

  it("uses that size's ask, not the product all-size low", () => {
    const m = market();
    // Product all-size low is 185 (size 9), size 12 ask is 210
    const result = evaluateDeal(m, 200, size12());
    expect(result?.ask).toBe(210);
    expect(result?.ask).not.toBe(m.stats.lowestAsk);
    expect(result?.comps.find((c) => c.id === "ask")?.detail).toContain("210");
  });

  it("returns stretch slightly above the size ask", () => {
    const result = evaluateDeal(market(), 220, size9());
    expect(result?.ask).toBe(185);
    expect(result?.verdict).toBe("stretch");
  });
});

import { describe, expect, it } from "vitest";
import { mapProductToMarket } from "@/services/market/mapProductToMarket";
import type { KicksProduct } from "@/types/kicksdb";
import {
  buildBootstrapSeries,
  buildLaspeyresIndex,
  changeFromPrices,
  premiumVsRetail,
  salesToSeries,
  sumSales,
  upsertToday,
} from "@/utils/metrics";
import { resolveLocalHistory } from "@/services/market/historyStore";

const catalog = {
  slug: "air-jordan-1-retro-high-dark-mocha",
  year: 2020,
  ticker: "J1-DMCH",
  styleCode: "555088-105",
  releaseDate: "2020-10-31",
  colorway: "Sail / Dark Mocha / Black",
  retail: 170,
  name: "Jordan 1 High Dark Mocha",
  brand: "Jordan",
  fallbackImage: "https://example.com/shoe.jpg",
  stockxUrl: "https://stockx.com/air-jordan-1-retro-high-dark-mocha",
};

function productFixture(): KicksProduct {
  return {
    id: "product-1",
    title: "Jordan 1 Retro High Dark Mocha",
    brand: "Jordan",
    sku: "555088-105",
    min_price: 202,
    max_price: 400,
    avg_price: 280,
    weekly_orders: 70,
    rank: 100,
    statistics: {
      last_90_days_range_high: 640,
      last_90_days_range_low: 187,
      last_90_days_average_price: 264,
      annual_high: 644,
      annual_low: 172,
    },
    variants: [
      {
        size: "10",
        size_type: "us m",
        lowest_ask: 210,
        total_asks: 4,
        sales_count_15_days: 2,
        sales_count_30_days: 5,
        sales_count_60_days: 9,
      },
      {
        size: "9",
        size_type: "us m",
        lowest_ask: 202,
        total_asks: 3,
        sales_count_15_days: 1,
        sales_count_30_days: 3,
        sales_count_60_days: 6,
      },
      {
        size: "11",
        size_type: "us m",
        lowest_ask: null,
        total_asks: 0,
        hidden: true,
        sales_count_15_days: 0,
        sales_count_30_days: 0,
        sales_count_60_days: 0,
      },
    ],
  };
}

describe("changeFromPrices", () => {
  it("returns null for missing previous", () => {
    expect(changeFromPrices(100, null)).toBeNull();
    expect(changeFromPrices(100, 0)).toBeNull();
  });

  it("computes absolute and percent change", () => {
    expect(changeFromPrices(110, 100)).toEqual({
      absolute: 10,
      percent: 10,
    });
  });
});

describe("premiumVsRetail", () => {
  it("returns null without ask or retail", () => {
    expect(premiumVsRetail(null, 170)).toBeNull();
    expect(premiumVsRetail(200, 0)).toBeNull();
  });

  it("computes premium over retail", () => {
    expect(premiumVsRetail(204, 170)).toEqual({
      absolute: 34,
      percent: 20,
    });
  });
});

describe("sumSales", () => {
  it("sums pairs and notional for a window", () => {
    const points = [
      { date: "2026-01-01", price: 100, orders: 2 },
      { date: "2026-01-02", price: 200, orders: 3 },
    ];
    expect(sumSales(points, 1)).toEqual({ pairs: 3, notional: 600 });
    expect(sumSales(points, 2)).toEqual({ pairs: 5, notional: 800 });
  });
});

describe("salesToSeries + upsertToday", () => {
  it("normalizes sales dates ascending for chart use", () => {
    const series = salesToSeries([
      { date: "2026-01-02T00:00:00Z", avg_amount: 220, orders: 2 },
      { date: "2026-01-01T00:00:00Z", avg_amount: 200, orders: 1 },
    ]);
    expect(series).toEqual([
      { date: "2026-01-01", price: 200, orders: 1 },
      { date: "2026-01-02", price: 220, orders: 2 },
    ]);
  });

  it("replaces same-day point when upserting", () => {
    const series = upsertToday(
      [{ date: "2026-01-01", price: 100, orders: 1 }],
      202,
      4,
      "2026-01-01",
    );
    expect(series).toEqual([{ date: "2026-01-01", price: 202, orders: 4 }]);
  });
});

describe("mapProductToMarket", () => {
  it("maps live asks and size ladder", () => {
    const market = mapProductToMarket({
      product: productFixture(),
      catalog,
      chartSeries: [
        { date: "2026-01-01", price: 250, orders: 2 },
        { date: "2026-01-02", price: 260, orders: 3 },
      ],
      historySource: "bootstrap",
    });

    expect(market.slug).toBe(catalog.slug);
    expect(market.releaseDate).toBe("2020-10-31");
    expect(market.price).toBe(202);
    expect(market.stats.highestBid).toBeNull();
    expect(market.sizes.map((size) => size.size)).toEqual(["9", "10"]);
    expect(market.stats.askCount).toBe(7);
    expect(market.stats.sales30d).toBe(8);
    expect(market.upstreamStatus).toBe("live");
  });

  it("does not derive % change from bootstrap history", () => {
    const market = mapProductToMarket({
      product: productFixture(),
      catalog,
      chartSeries: [
        { date: "2026-01-01", price: 200, orders: 2 },
        { date: "2026-01-02", price: 220, orders: 2 },
      ],
      historySource: "bootstrap",
    });

    expect(market.changeToday).toBeNull();
    expect(market.change30d).toBeNull();
    expect(market.stats.high24h).toBeNull();
    expect(market.stats.low24h).toBeNull();
    expect(market.stats.lastSale).toBeNull();
    expect(market.volume24hSource).toBe("weekly_orders");
    expect(market.stats.high30dSource).toBe("stockx_stats");
  });

  it("derives % change and sale highs from sales history", () => {
    const market = mapProductToMarket({
      product: productFixture(),
      catalog,
      chartSeries: [
        { date: "2026-01-01", price: 200, orders: 2 },
        { date: "2026-01-02", price: 220, orders: 4 },
      ],
      historySource: "sales",
    });

    expect(market.changeToday).toEqual({ absolute: 20, percent: 10 });
    expect(market.stats.high24h).toBe(220);
    expect(market.stats.low24h).toBe(220);
    expect(market.stats.lastSale).toBe(220);
    expect(market.volume24h).toEqual({ pairs: 4, notional: 880 });
    expect(market.volume24hSource).toBe("sales");
    expect(market.stats.high30dSource).toBe("sales");
  });

  it("derives % change from snapshot history", () => {
    const market = mapProductToMarket({
      product: productFixture(),
      catalog,
      chartSeries: [
        { date: "2026-01-01", price: 190, orders: 1 },
        { date: "2026-01-02", price: 209, orders: 1 },
      ],
      historySource: "snapshot",
      upstreamStatus: "cached",
    });

    expect(market.changeToday).toEqual({ absolute: 19, percent: 10 });
    expect(market.volume24hSource).toBe("snapshot");
    expect(market.stats.high30dSource).toBe("snapshot");
    expect(market.upstreamStatus).toBe("cached");
  });
});

describe("resolveLocalHistory", () => {
  it("prefers multi-point snapshots over bootstrap for Dark Mocha", () => {
    const local = resolveLocalHistory("air-jordan-1-retro-high-dark-mocha");
    expect(local.source).toBe("snapshot");
    expect(local.series.length).toBeGreaterThanOrEqual(2);
  });
});

describe("buildBootstrapSeries", () => {
  it("builds a multi-point series ending at the live ask", () => {
    const series = buildBootstrapSeries({
      livePrice: 200,
      low: 160,
      high: 240,
      average: 190,
      volatility: 0.2,
      weeklyOrders: 70,
      days: 30,
      endDate: "2026-07-22",
    });

    expect(series.length).toBe(30);
    expect(series[0].date).toBe("2026-06-23");
    expect(series.at(-1)?.date).toBe("2026-07-22");
    expect(series.at(-1)?.price).toBe(200);
    expect(series.every((point) => point.price >= 160 && point.price <= 240)).toBe(
      true,
    );
  });

  it("is deterministic for the same inputs", () => {
    const input = {
      livePrice: 48,
      low: 35,
      high: 53,
      average: 40,
      weeklyOrders: 900,
      days: 14,
      endDate: "2026-07-22",
    };
    expect(buildBootstrapSeries(input)).toEqual(buildBootstrapSeries(input));
  });

  it("returns empty when live price is missing", () => {
    expect(buildBootstrapSeries({ livePrice: 0 })).toEqual([]);
  });
});

describe("buildLaspeyresIndex", () => {
  it("starts near the base level and tracks relative moves", () => {
    const series = buildLaspeyresIndex(
      [
        {
          id: "a",
          weight: 2,
          series: [
            { date: "2026-01-01", price: 100, orders: 1 },
            { date: "2026-01-02", price: 110, orders: 1 },
            { date: "2026-01-03", price: 120, orders: 1 },
          ],
        },
        {
          id: "b",
          weight: 1,
          series: [
            { date: "2026-01-01", price: 200, orders: 1 },
            { date: "2026-01-02", price: 200, orders: 1 },
            { date: "2026-01-03", price: 180, orders: 1 },
          ],
        },
      ],
      { baseLevel: 1000 },
    );

    expect(series[0]?.price).toBe(1000);
    // Day 2: (2*(110/100) + 1*(200/200)) / 3 * 1000 = (2.2 + 1) / 3 * 1000 = 1066.67
    expect(series[1]?.price).toBeCloseTo(1066.67, 1);
    expect(series.at(-1)?.date).toBe("2026-01-03");
  });
});

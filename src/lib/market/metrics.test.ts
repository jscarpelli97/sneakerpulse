import { describe, expect, it } from "vitest";
import { mapProductToMarket } from "@/lib/market/mapProductToMarket";
import type { KicksProduct } from "@/lib/kicksdb/client";
import {
  changeFromPrices,
  salesToSeries,
  sumSales,
  upsertToday,
} from "@/lib/market/metrics";
import { resolveLocalHistory } from "@/lib/market/historyStore";

const catalog = {
  slug: "air-jordan-1-retro-high-dark-mocha",
  year: 2020,
  ticker: "J1-DMCH",
  styleCode: "555088-105",
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
    expect(market.price).toBe(202);
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

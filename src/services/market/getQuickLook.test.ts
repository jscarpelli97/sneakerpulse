import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import { getQuickLook } from "@/services/market/getQuickLook";

function quote(
  partial: Partial<CatalogQuote> &
    Pick<CatalogQuote, "slug" | "name" | "price" | "retail" | "weeklyOrders">,
): CatalogQuote {
  return {
    ticker: "TEST",
    styleCode: "TEST-1",
    brand: "Nike",
    year: 2024,
    releaseDate: "2024-01-01",
    colorway: "Black",
    stockxUrl: "https://stockx.com/test",
    fallbackImage: "https://images.stockx.com/test.jpg",
    rank: 10,
    live: false,
    ...partial,
  };
}

describe("getQuickLook", () => {
  it("picks best value under retail with flow, plus tone fallbacks", async () => {
    const quotes = [
      quote({
        slug: "value-shoe",
        name: "Value Shoe",
        ticker: "VAL",
        price: 80,
        retail: 120,
        weeklyOrders: 5000,
        rank: 1,
      }),
      quote({
        slug: "rich-shoe",
        name: "Rich Shoe",
        ticker: "RICH",
        price: 300,
        retail: 150,
        weeklyOrders: 3000,
        rank: 2,
      }),
      quote({
        slug: "fair-shoe",
        name: "Fair Shoe",
        ticker: "FAIR",
        price: 102,
        retail: 100,
        weeklyOrders: 4000,
        rank: 3,
      }),
    ];

    const look = await getQuickLook(quotes);
    expect(look.picks.length).toBeGreaterThanOrEqual(3);
    const value = look.picks.find((p) => p.kind === "best_value");
    expect(value?.slug).toBe("value-shoe");
    expect(look.picks.some((p) => p.kind === "bullish")).toBe(true);
    expect(look.picks.some((p) => p.kind === "bearish")).toBe(true);
    expect(look.picks.some((p) => p.kind === "mixed")).toBe(true);
  });
});

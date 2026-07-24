import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kicksdb/client", () => ({
  getKicksApiKey: vi.fn(() => "test-key"),
  fetchStockxProduct: vi.fn(),
}));

vi.mock("@/services/catalog/discoveredProducts", () => ({
  resolveCatalogQuoteBySlug: vi.fn(async () => ({
    slug: "air-jordan-1-retro-low-og-mocha",
    ticker: "CZ0790-102",
    styleCode: "CZ0790-102",
    name: "Jordan 1 Retro Low OG Mocha",
    brand: "Jordan",
    year: 2020,
    releaseDate: "2020-01-01",
    colorway: "Mocha",
    retail: 170,
    stockxUrl: "https://stockx.com/air-jordan-1-retro-low-og-mocha",
    fallbackImage: "https://example.com/x.jpg",
    price: 185,
    weeklyOrders: 10,
    rank: 3,
    featured: false,
    live: false,
  })),
}));

import { fetchStockxProduct } from "@/lib/kicksdb/client";
import { getLiveSizeLadder } from "@/services/market/getLiveSizeLadder";

describe("getLiveSizeLadder", () => {
  beforeEach(() => {
    vi.mocked(fetchStockxProduct).mockReset();
  });

  it("returns per-size asks from a live product pull", async () => {
    vi.mocked(fetchStockxProduct).mockResolvedValue({
      ok: true,
      cacheHit: false,
      status: 200,
      data: {
        data: {
          id: "p1",
          title: "Jordan 1 Retro Low OG Mocha",
          brand: "Jordan",
          sku: "CZ0790-102",
          slug: "air-jordan-1-retro-low-og-mocha",
          image: "https://example.com/x.jpg",
          min_price: 185,
          variants: [
            {
              size: "9",
              size_type: "us m",
              lowest_ask: 185,
              total_asks: 4,
              hidden: false,
            },
            {
              size: "12",
              size_type: "us m",
              lowest_ask: 240,
              total_asks: 2,
              hidden: false,
            },
          ],
        },
      },
    } as never);

    const ladder = await getLiveSizeLadder(
      "air-jordan-1-retro-low-og-mocha",
    );
    expect(ladder.live).toBe(true);
    expect(ladder.sizes.map((s) => s.size)).toEqual(["9", "12"]);
    expect(ladder.sizes.find((s) => s.size === "12")?.lowestAsk).toBe(240);
  });
});

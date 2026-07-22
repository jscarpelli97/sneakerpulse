import { describe, expect, it } from "vitest";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";
import { filterCatalogRows, sortCatalogRows } from "@/utils/catalogTable";

function row(
  partial: Partial<CatalogQuote> & Pick<CatalogQuote, "slug" | "name">,
): CatalogQuote {
  return {
    ticker: "TEST",
    styleCode: "TEST-001",
    brand: "Nike",
    year: 2024,
    releaseDate: "2024-01-01",
    colorway: "Black",
    retail: 100,
    stockxUrl: "https://stockx.com/test",
    fallbackImage: "https://images.stockx.com/test.jpg",
    price: 120,
    rank: 10,
    weeklyOrders: 1000,
    live: true,
    ...partial,
  };
}

describe("filterCatalogRows", () => {
  const rows = [
    row({ slug: "dunk", name: "Nike Dunk Low", ticker: "DUNK", brand: "Nike" }),
    row({
      slug: "jordan",
      name: "Jordan 4 Retro",
      ticker: "J4",
      brand: "Jordan",
      styleCode: "FV5029-001",
    }),
  ];

  it("filters by name brand ticker and sku", () => {
    expect(filterCatalogRows(rows, "dunk")).toHaveLength(1);
    expect(filterCatalogRows(rows, "jordan")).toHaveLength(1);
    expect(filterCatalogRows(rows, "FV5029")).toHaveLength(1);
    expect(filterCatalogRows(rows, "nope")).toHaveLength(0);
  });
});

describe("sortCatalogRows", () => {
  const rows = [
    row({ slug: "a", name: "Beta", rank: 2, price: 200, weeklyOrders: 50 }),
    row({ slug: "b", name: "Alpha", rank: 1, price: 100, weeklyOrders: 90 }),
  ];

  it("sorts by rank ascending by default intent", () => {
    const sorted = sortCatalogRows(rows, "rank", "asc");
    expect(sorted.map((r) => r.slug)).toEqual(["b", "a"]);
  });

  it("sorts by price descending", () => {
    const sorted = sortCatalogRows(rows, "price", "desc");
    expect(sorted.map((r) => r.price)).toEqual([200, 100]);
  });

  it("sorts by name", () => {
    const sorted = sortCatalogRows(rows, "name", "asc");
    expect(sorted.map((r) => r.name)).toEqual(["Alpha", "Beta"]);
  });
});

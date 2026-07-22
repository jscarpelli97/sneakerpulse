import { describe, expect, it } from "vitest";
import {
  basketNeedsRebalance,
  selectChronoBasket,
} from "@/lib/index/selectChronoBasket";
import type { KicksProduct } from "@/types/kicksdb";

function product(
  partial: Partial<KicksProduct> & { slug: string; brand: string },
): KicksProduct {
  return {
    id: partial.slug,
    title: partial.title ?? partial.slug,
    brand: partial.brand,
    slug: partial.slug,
    product_type: "sneakers",
    avg_price: 100,
    min_price: 100,
    max_price: 120,
    weekly_orders: partial.weekly_orders ?? 10,
    rank: partial.rank ?? null,
    traits: null,
    variants: null,
    statistics: null,
  };
}

describe("selectChronoBasket", () => {
  it("picks top brands by volume and top models per brand", () => {
    const products = [
      product({ slug: "jordan-a", brand: "Jordan", weekly_orders: 100 }),
      product({ slug: "jordan-b", brand: "Jordan", weekly_orders: 90 }),
      product({ slug: "jordan-c", brand: "Jordan", weekly_orders: 5 }),
      product({ slug: "nike-a", brand: "Nike", weekly_orders: 80 }),
      product({ slug: "nike-b", brand: "Nike", weekly_orders: 70 }),
      product({ slug: "asics-a", brand: "ASICS", weekly_orders: 20 }),
    ];
    const basket = selectChronoBasket(products, {
      brandCount: 2,
      modelsPerBrand: 2,
      rebalancedAt: "2026-07-22",
    });
    expect(basket.brands.map((b) => b.brand)).toEqual(["Jordan", "Nike"]);
    expect(basket.members.map((m) => m.slug)).toEqual([
      "jordan-a",
      "jordan-b",
      "nike-a",
      "nike-b",
    ]);
    expect(basket.nextRebalanceAt).toBe("2027-01-22");
  });

  it("records adds/removes against the previous basket", () => {
    const first = selectChronoBasket(
      [
        product({ slug: "a", brand: "Jordan", weekly_orders: 10 }),
        product({ slug: "b", brand: "Nike", weekly_orders: 9 }),
      ],
      { brandCount: 2, modelsPerBrand: 1, rebalancedAt: "2026-01-01" },
    );
    const second = selectChronoBasket(
      [
        product({ slug: "a", brand: "Jordan", weekly_orders: 10 }),
        product({ slug: "c", brand: "Nike", weekly_orders: 12 }),
      ],
      {
        brandCount: 2,
        modelsPerBrand: 1,
        rebalancedAt: "2026-07-01",
        previous: first,
      },
    );
    expect(second.changes.at(-1)).toEqual({
      date: "2026-07-01",
      added: ["c"],
      removed: ["b"],
    });
  });
});

describe("basketNeedsRebalance", () => {
  it("is due on or after nextRebalanceAt", () => {
    const basket = selectChronoBasket(
      [product({ slug: "a", brand: "Jordan", weekly_orders: 1 })],
      { rebalancedAt: "2026-01-01" },
    );
    expect(basketNeedsRebalance(basket, "2026-06-30")).toBe(false);
    expect(basketNeedsRebalance(basket, "2026-07-01")).toBe(true);
  });
});

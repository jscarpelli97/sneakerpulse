import { describe, expect, it } from "vitest";
import { makeTicker, stockxStyleId } from "@/services/catalog/mapProductToCatalog";
import type { KicksProduct } from "@/types/kicksdb";

function product(partial: Partial<KicksProduct>): KicksProduct {
  return {
    id: "1",
    title: "YZY YS-01 Black",
    brand: "Yeezy",
    sku: "",
    slug: "yzy-ys-01-black",
    ...partial,
  };
}

describe("stockxStyleId / makeTicker", () => {
  it("keeps StockX style IDs exact (hyphens included)", () => {
    expect(makeTicker(product({ sku: "FQ8138-600" }))).toBe("FQ8138-600");
    expect(makeTicker(product({ sku: "315122-111/CW2288-111" }))).toBe(
      "315122-111/CW2288-111",
    );
    expect(stockxStyleId(product({ sku: "IQ8055-100" }))).toBe("IQ8055-100");
  });

  it("uses Style trait when sku is empty", () => {
    expect(
      makeTicker(
        product({
          sku: "",
          traits: [{ trait: "Style", value: "DD0587-008" }],
        }),
      ),
    ).toBe("DD0587-008");
  });

  it("does not invent tickers when StockX has no style ID", () => {
    expect(makeTicker(product({ sku: "", title: "YZY YS-01 Black" }))).toBe(
      "—",
    );
  });
});

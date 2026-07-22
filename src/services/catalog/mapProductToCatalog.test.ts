import { describe, expect, it } from "vitest";
import {
  makeTicker,
  tickerFromName,
} from "@/services/catalog/mapProductToCatalog";
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

describe("makeTicker", () => {
  it("uses cleaned SKU when present", () => {
    expect(makeTicker(product({ sku: "FQ8138-600" }))).toBe("FQ8138600");
  });

  it("uses model + colorway from the name when SKU is missing", () => {
    expect(tickerFromName("YZY YS-01 Black", "yzy-ys-01-black")).toBe(
      "YS01BLACK",
    );
    expect(tickerFromName("YZY YS-01 Cream", "yzy-ys-01-silver-green")).toBe(
      "YS01CREAM",
    );
    expect(tickerFromName("YZY YS-01 Fudge", "yzy-ys-01-fudge")).toBe(
      "YS01FUDGE",
    );
    expect(
      makeTicker(
        product({
          title: "YZY YS-01 Black",
            rank: 1,
          sku: "",
        }),
      ),
    ).toBe("YS01BLACK");
  });
});

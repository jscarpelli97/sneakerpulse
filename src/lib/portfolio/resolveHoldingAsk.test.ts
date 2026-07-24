import { describe, expect, it } from "vitest";
import {
  findSizeAsk,
  normalizeSizeLabel,
  resolveHoldingAsk,
} from "@/lib/portfolio/resolveHoldingAsk";
import type { SizeAsk } from "@/types/market";

const sizes: SizeAsk[] = [
  {
    size: "9",
    sizeType: "us m",
    lowestAsk: 185,
    totalAsks: 4,
    sales15d: 1,
    sales30d: 2,
    sales60d: 3,
  },
  {
    size: "12",
    sizeType: "us m",
    lowestAsk: 240,
    totalAsks: 2,
    sales15d: 0,
    sales30d: 1,
    sales60d: 2,
  },
];

describe("resolveHoldingAsk", () => {
  it("normalizes size labels", () => {
    expect(normalizeSizeLabel(" 12 ")).toBe("12");
    expect(normalizeSizeLabel("10.0")).toBe("10");
    expect(normalizeSizeLabel("—")).toBe("");
  });

  it("finds the matching size row", () => {
    expect(findSizeAsk(sizes, "12")?.lowestAsk).toBe(240);
    expect(findSizeAsk(sizes, "12.0")?.lowestAsk).toBe(240);
  });

  it("prefers size ask over product all-size catalog price", () => {
    const result = resolveHoldingAsk({
      holdingSize: "12",
      sizes,
      catalogPrice: 185, // all-size low (size 9)
      marketPrice: 185,
      statsLowestAsk: 185,
    });
    expect(result).toEqual({ ask: 240, source: "size" });
  });

  it("falls back when size has no ask", () => {
    const result = resolveHoldingAsk({
      holdingSize: "11",
      sizes,
      catalogPrice: 190,
    });
    expect(result).toEqual({ ask: 190, source: "fallback" });
  });

  it("returns none when nothing is available", () => {
    expect(
      resolveHoldingAsk({ holdingSize: "12", sizes: [] }),
    ).toEqual({ ask: null, source: "none" });
  });
});

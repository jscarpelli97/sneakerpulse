import { describe, expect, it } from "vitest";
import { formatBtc, usdToBtc } from "@/lib/btc/format";

describe("btc format", () => {
  it("converts usd to btc", () => {
    expect(usdToBtc(95_000, 95_000)).toBe(1);
    expect(usdToBtc(950, 95_000)).toBeCloseTo(0.01);
    expect(usdToBtc(10, 0)).toBeNull();
  });

  it("formats amounts", () => {
    expect(formatBtc(1.23456)).toContain("BTC");
    expect(formatBtc(null)).toBe("—");
  });
});

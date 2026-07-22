import { describe, expect, it } from "vitest";
import { isPaidStatus } from "@/lib/plus/opennode";
import { plusPriceUsd, plusTermDays } from "@/lib/plus/config";

describe("plus billing helpers", () => {
  it("treats paid and processing as settled", () => {
    expect(isPaidStatus("paid")).toBe(true);
    expect(isPaidStatus("processing")).toBe(true);
    expect(isPaidStatus("unpaid")).toBe(false);
  });

  it("exposes price and term defaults", () => {
    expect(plusPriceUsd()).toBeGreaterThan(0);
    expect(plusTermDays()).toBeGreaterThan(0);
  });
});

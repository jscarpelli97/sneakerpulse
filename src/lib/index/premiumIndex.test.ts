import { describe, expect, it } from "vitest";
import { buildPremiumIndexLevel } from "@/lib/index/premiumIndex";

describe("buildPremiumIndexLevel", () => {
  it("returns 100 when the basket is at retail", () => {
    const out = buildPremiumIndexLevel([
      { ask: 100, retail: 100, weight: 2 },
      { ask: 200, retail: 200, weight: 1 },
      { ask: 150, retail: 150, weight: 1 },
    ]);
    expect(out.level).toBe(100);
    expect(out.premiumPercent).toBe(0);
    expect(out.atOrBelowRetail).toBe(3);
  });

  it("weights higher-volume models more and can go below retail", () => {
    const out = buildPremiumIndexLevel([
      { ask: 80, retail: 100, weight: 9 }, // 0.8
      { ask: 200, retail: 100, weight: 1 }, // 2.0
      { ask: 90, retail: 100, weight: 0 }, // treated as weight 1 → 0.9
    ]);
    // (9*0.8 + 1*2.0 + 1*0.9) / 11 = 10.1/11 → 91.82
    expect(out.level).toBe(91.82);
    expect(out.premiumPercent).toBe(-8.18);
    expect(out.atOrBelowRetail).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { buildPremiumSeries } from "@/services/market/getMarketIndex";
import type { ChartPoint } from "@/types/market";

function pt(date: string, price: number): ChartPoint {
  return { date, price, orders: 1 };
}

describe("buildPremiumSeries", () => {
  it("bridges daily from 2021 to today so ALL reaches the present", () => {
    const historical = [pt("2021-12-25", 196), pt("2021-12-26", 195)];
    const out = buildPremiumSeries(historical, [], 90, "2026-07-22");
    expect(out[0]?.date).toBe("2021-12-25");
    expect(out.at(-1)?.date).toBe("2026-07-22");
    expect(out.at(-1)?.price).toBe(90);
    expect(out.length).toBeGreaterThan(1000);
    // Mid-gap should be between boom and live — declining, not stuck at 195.
    const mid = out.find((p) => p.date === "2024-01-01");
    expect(mid).toBeTruthy();
    expect(mid!.price).toBeLessThan(195);
    expect(mid!.price).toBeGreaterThan(90);
  });

  it("lets live premium win on the tip over extension", () => {
    const historical = [pt("2021-12-26", 195)];
    const extension = [pt("2026-07-22", 88)];
    const out = buildPremiumSeries(historical, extension, 93, "2026-07-22");
    expect(out.at(-1)?.price).toBe(93);
  });
});

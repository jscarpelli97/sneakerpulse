import { describe, expect, it } from "vitest";
import { buildPremiumSeries } from "@/services/market/getMarketIndex";
import type { ChartPoint } from "@/types/market";

function pt(date: string, price: number): ChartPoint {
  return { date, price, orders: 1 };
}

describe("buildPremiumSeries", () => {
  it("keeps 2021 history and stamps today's live premium without peak LOCF", () => {
    const historical = [pt("2021-12-25", 196), pt("2021-12-26", 195)];
    const out = buildPremiumSeries(historical, [], 88, "2026-07-22");
    expect(out.map((p) => p.date)).toEqual([
      "2021-12-25",
      "2021-12-26",
      "2026-07-22",
    ]);
    expect(out.at(-1)?.price).toBe(88);
    // Must not invent years of 195 between 2021 and 2026.
    expect(out.filter((p) => p.date.startsWith("2023")).length).toBe(0);
  });

  it("lets extension snapshots override the live tip", () => {
    const historical = [pt("2021-12-26", 195)];
    const extension = [pt("2026-07-21", 90), pt("2026-07-22", 87)];
    const out = buildPremiumSeries(historical, extension, 99, "2026-07-22");
    expect(out.at(-1)).toEqual(pt("2026-07-22", 99));
    expect(out.find((p) => p.date === "2026-07-21")?.price).toBe(90);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildPremiumSeries,
  splitPremiumSegments,
} from "@/services/market/getMarketIndex";
import type { ChartPoint } from "@/types/market";

function pt(date: string, price: number): ChartPoint {
  return { date, price, orders: 1 };
}

describe("buildPremiumSeries", () => {
  it("keeps only real points — no invented 2022–2025 bridge", () => {
    const historical = [pt("2021-12-25", 196), pt("2021-12-26", 195)];
    const out = buildPremiumSeries(historical, [], 90, "2026-07-22");
    expect(out.map((p) => p.date)).toEqual([
      "2021-12-25",
      "2021-12-26",
      "2026-07-22",
    ]);
    expect(out.filter((p) => p.date.startsWith("2023")).length).toBe(0);
  });
});

describe("splitPremiumSegments", () => {
  it("splits boom tape from live tip across the public-data gap", () => {
    const points = [
      pt("2021-12-25", 196),
      pt("2021-12-26", 195),
      pt("2026-07-22", 94),
    ];
    const { historical, live } = splitPremiumSegments(points);
    expect(historical.map((p) => p.date)).toEqual([
      "2021-12-25",
      "2021-12-26",
    ]);
    expect(live.map((p) => p.date)).toEqual(["2026-07-22"]);
  });
});

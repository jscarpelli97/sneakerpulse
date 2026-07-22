import { describe, expect, it } from "vitest";
import {
  appendLocfThrough,
  buildContinuousSeries,
} from "@/services/market/getMarketIndex";
import type { ChartPoint } from "@/types/market";

function pt(date: string, price: number): ChartPoint {
  return { date, price, orders: 1 };
}

describe("appendLocfThrough", () => {
  it("extends daily points through the requested end date", () => {
    const out = appendLocfThrough(
      [pt("2021-12-25", 100), pt("2021-12-26", 110)],
      "2021-12-29",
    );
    expect(out.map((p) => p.date)).toEqual([
      "2021-12-25",
      "2021-12-26",
      "2021-12-27",
      "2021-12-28",
      "2021-12-29",
    ]);
    expect(out.at(-1)?.price).toBe(110);
  });
});

describe("buildContinuousSeries", () => {
  it("always reaches asOf even with no live series", () => {
    const historical = [pt("2021-12-25", 5000), pt("2021-12-26", 5300)];
    const extension = [pt("2026-07-22", 5300)];
    const out = buildContinuousSeries(historical, extension, [], "2026-07-22");
    expect(out[0]?.date).toBe("2021-12-25");
    expect(out.at(-1)?.date).toBe("2026-07-22");
    expect(out.length).toBeGreaterThan(1000);
  });

  it("stitches live returns onto the bridged series through asOf", () => {
    const historical = [pt("2021-12-25", 1000), pt("2021-12-26", 1000)];
    const live = [
      pt("2026-07-20", 100),
      pt("2026-07-21", 110),
      pt("2026-07-22", 121),
    ];
    const out = buildContinuousSeries(historical, [], live, "2026-07-22");
    expect(out.at(-1)?.date).toBe("2026-07-22");
    // 10% then 10% on top of bridged level 1000 → 1210
    expect(out.at(-1)?.price).toBe(1210);
    expect(out.find((p) => p.date === "2022-06-01")?.price).toBe(1000);
  });
});

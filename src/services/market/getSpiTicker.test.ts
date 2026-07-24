import { describe, expect, it } from "vitest";
import { getSpiTickerQuote } from "@/services/market/getSpiTicker";

describe("getSpiTickerQuote", () => {
  it("returns SPI level and day change from the open-data tape", async () => {
    const quote = await getSpiTickerQuote();
    expect(quote).not.toBeNull();
    expect(quote!.ticker).toBe("SPI");
    expect(quote!.level).toBeGreaterThan(0);
    expect(quote!.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // With ≥2 live days, day % should resolve (absolute is index points, not $).
    if (quote!.changeToday) {
      expect(Number.isFinite(quote!.changeToday.percent)).toBe(true);
      expect(Number.isFinite(quote!.changeToday.absolute)).toBe(true);
    }
  });
});

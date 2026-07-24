import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  databaseConfigured: () => false,
  query: vi.fn(),
}));

import { resolvePlusOffer } from "@/lib/plus/purchases";

describe("resolvePlusOffer", () => {
  beforeEach(() => {
    globalThis.__spiPlusPurchasesMem = new Map();
  });

  it("offers founding $10 / 365 days while under the cap", async () => {
    const offer = await resolvePlusOffer();
    expect(offer.plan).toBe("founding");
    expect(offer.amountUsd).toBe(10);
    expect(offer.termDays).toBe(365);
    expect(offer.foundingRemaining).toBe(100);
  });
});

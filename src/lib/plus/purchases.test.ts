import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  databaseConfigured: () => false,
  query: vi.fn(),
}));

import { recordPlusPurchase, resolvePlusOffer } from "@/lib/plus/purchases";

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

  it("does not count Stripe test sessions against the founding cap", async () => {
    await recordPlusPurchase({
      id: "cs_test_fake_session",
      email: "tester@example.com",
      provider: "stripe",
      plan: "founding",
      amountUsd: 10,
      termDays: 365,
      status: "paid",
    });
    const offer = await resolvePlusOffer();
    expect(offer.foundingRemaining).toBe(100);
  });
});

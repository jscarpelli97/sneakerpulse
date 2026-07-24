import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ebay/client", () => ({
  searchEbayItemSummaries: vi.fn(),
}));

import { searchEbayItemSummaries } from "@/lib/ebay/client";
import { getEbayCompsForProduct } from "@/services/market/getEbayComps";

const KEYS = [
  "NEXT_PUBLIC_EBAY_PUBLIC",
  "EBAY_PUBLIC",
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
] as const;

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
  vi.mocked(searchEbayItemSummaries).mockReset();
});

describe("getEbayCompsForProduct", () => {
  it("returns null when the public flag is off", async () => {
    const comps = await getEbayCompsForProduct({
      styleCode: "BQ6817-010",
      name: "Nike SB Dunk Low Fog",
    });
    expect(comps).toBeNull();
    expect(searchEbayItemSummaries).not.toHaveBeenCalled();
  });

  it("returns link-only when flag is on but credentials are missing", async () => {
    process.env.NEXT_PUBLIC_EBAY_PUBLIC = "1";
    const comps = await getEbayCompsForProduct({
      styleCode: "BQ6817-010",
      name: "Nike SB Dunk Low Fog",
    });
    expect(comps?.status).toBe("link_only");
    expect(comps?.searchUrl).toContain("BQ6817-010");
    expect(searchEbayItemSummaries).not.toHaveBeenCalled();
  });

  it("maps live Browse results when credentials exist", async () => {
    process.env.NEXT_PUBLIC_EBAY_PUBLIC = "1";
    process.env.EBAY_CLIENT_ID = "id";
    process.env.EBAY_CLIENT_SECRET = "secret";
    vi.mocked(searchEbayItemSummaries).mockResolvedValue({
      ok: true,
      cacheHit: false,
      data: {
        total: 2,
        itemSummaries: [
          {
            itemId: "1",
            title: "Dunk Fog US 10",
            itemWebUrl: "https://www.ebay.com/itm/1",
            price: { value: "220", currency: "USD" },
          },
          {
            itemId: "2",
            title: "Dunk Fog US 9",
            itemWebUrl: "https://www.ebay.com/itm/2",
            price: { value: "200", currency: "USD" },
          },
        ],
      },
    });

    const comps = await getEbayCompsForProduct({
      styleCode: "BQ6817-010",
      name: "Nike SB Dunk Low Fog",
    });

    expect(comps?.status).toBe("live");
    expect(comps?.lowestAsk).toBe(200);
    expect(comps?.medianAsk).toBe(210);
    expect(comps?.listings).toHaveLength(2);
  });
});

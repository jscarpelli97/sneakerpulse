import { describe, expect, it } from "vitest";
import {
  buildEbaySearchUrl,
  ebaySearchQuery,
} from "@/lib/ebay/searchUrl";

describe("ebaySearchQuery", () => {
  it("prefers style code over name", () => {
    expect(ebaySearchQuery("BQ6817-010", "Nike SB Dunk Low Fog")).toBe(
      "BQ6817-010",
    );
  });

  it("falls back to name when style code is empty", () => {
    expect(ebaySearchQuery("", "Nike SB Dunk Low Fog")).toBe(
      "Nike SB Dunk Low Fog",
    );
  });
});

describe("buildEbaySearchUrl", () => {
  it("builds a New athletic-shoes search URL", () => {
    const url = buildEbaySearchUrl({ query: "BQ6817-010" });
    expect(url).toContain("https://www.ebay.com/sch/i.html");
    expect(url).toContain("_nkw=BQ6817-010");
    expect(url).toContain("_sacat=15709");
    expect(url).toContain("LH_ItemCondition=1000");
  });
});

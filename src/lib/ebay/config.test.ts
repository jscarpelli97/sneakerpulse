import { afterEach, describe, expect, it } from "vitest";
import { ebayPublicEnabled, hasEbayCredentials } from "@/lib/ebay/config";

const KEYS = [
  "NEXT_PUBLIC_EBAY_PUBLIC",
  "EBAY_PUBLIC",
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
] as const;

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
});

describe("ebayPublicEnabled", () => {
  it("is off by default", () => {
    expect(ebayPublicEnabled()).toBe(false);
  });

  it("turns on with NEXT_PUBLIC_EBAY_PUBLIC=1", () => {
    process.env.NEXT_PUBLIC_EBAY_PUBLIC = "1";
    expect(ebayPublicEnabled()).toBe(true);
  });
});

describe("hasEbayCredentials", () => {
  it("requires both client id and secret", () => {
    expect(hasEbayCredentials()).toBe(false);
    process.env.EBAY_CLIENT_ID = "id";
    expect(hasEbayCredentials()).toBe(false);
    process.env.EBAY_CLIENT_SECRET = "secret";
    expect(hasEbayCredentials()).toBe(true);
  });
});

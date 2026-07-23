import { afterEach, describe, expect, it, vi } from "vitest";
import { FREE_CATALOG_LIMIT, gateCatalogRows } from "@/lib/plus/access";

describe("gateCatalogRows", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: i }));

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the full list for Plus members", () => {
    vi.stubEnv("NEXT_PUBLIC_PLUS_PUBLIC", "1");
    const access = gateCatalogRows(rows, true);
    expect(access.gated).toBe(false);
    expect(access.rows).toHaveLength(25);
  });

  it("does not gate while Plus public marketing is off (default)", () => {
    vi.stubEnv("NEXT_PUBLIC_PLUS_PUBLIC", "");
    const access = gateCatalogRows(rows, false);
    expect(access.gated).toBe(false);
    expect(access.rows).toHaveLength(25);
  });

  it("slices to the free limit for non-members when Plus is public", () => {
    vi.stubEnv("NEXT_PUBLIC_PLUS_PUBLIC", "1");
    const access = gateCatalogRows(rows, false);
    expect(access.gated).toBe(true);
    expect(access.rows).toHaveLength(FREE_CATALOG_LIMIT);
    expect(access.total).toBe(25);
  });
});

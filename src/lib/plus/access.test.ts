import { describe, expect, it } from "vitest";
import { FREE_CATALOG_LIMIT, gateCatalogRows } from "@/lib/plus/access";

describe("gateCatalogRows", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: i }));

  it("returns the full list for Plus members", () => {
    const access = gateCatalogRows(rows, true);
    expect(access.gated).toBe(false);
    expect(access.rows).toHaveLength(25);
  });

  it("slices to the free limit for non-members", () => {
    const access = gateCatalogRows(rows, false);
    expect(access.gated).toBe(true);
    expect(access.rows).toHaveLength(FREE_CATALOG_LIMIT);
    expect(access.total).toBe(25);
  });
});

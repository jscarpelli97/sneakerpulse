import { describe, expect, it } from "vitest";
import { getStarterClosetItems } from "@/lib/wardrobe/starterCloset";

describe("starter closet", () => {
  it("loads curated sneakers and apparel with images", () => {
    const rows = getStarterClosetItems();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.some((r) => r.kind === "sneaker" && r.slug)).toBe(true);
    expect(rows.some((r) => r.kind === "top")).toBe(true);
    for (const row of rows) {
      expect(row.image.length).toBeGreaterThan(8);
      expect(row.name.length).toBeGreaterThan(1);
    }
  });
});

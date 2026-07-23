import { describe, expect, it } from "vitest";
import { CLOSET_KINDS, CLOSET_KIND_LABELS } from "@/lib/wardrobe/types";
import { isDataImageUrl } from "@/lib/wardrobe/image";

describe("wardrobe types", () => {
  it("covers expected closet kinds", () => {
    expect(CLOSET_KINDS).toContain("sneaker");
    expect(CLOSET_KINDS).toContain("top");
    expect(CLOSET_KINDS).toContain("bottom");
    expect(CLOSET_KIND_LABELS.sneaker).toBe("Sneakers");
  });
});

describe("wardrobe image helpers", () => {
  it("detects data URLs", () => {
    expect(isDataImageUrl("data:image/jpeg;base64,abc")).toBe(true);
    expect(isDataImageUrl("https://images.stockx.com/x.png")).toBe(false);
  });
});

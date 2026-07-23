import { describe, expect, it } from "vitest";
import { getOutfitIdeas } from "@/lib/wardrobe/outfitIdeas";

describe("outfit ideas", () => {
  it("loads curated outfits with tee, shorts, and sneakers", () => {
    const outfits = getOutfitIdeas();
    expect(outfits.length).toBeGreaterThanOrEqual(2);
    for (const outfit of outfits) {
      expect(outfit.pieces.length).toBeGreaterThanOrEqual(3);
      expect(outfit.pieces.some((p) => p.kind === "top")).toBe(true);
      expect(outfit.pieces.some((p) => p.kind === "bottom")).toBe(true);
      expect(outfit.pieces.some((p) => p.kind === "sneaker")).toBe(true);
      for (const piece of outfit.pieces) {
        expect(piece.image.length).toBeGreaterThan(8);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  getOutfitIdeas,
  outfitPiecesWithSneaker,
} from "@/lib/wardrobe/outfitIdeas";

describe("outfit ideas", () => {
  it("loads curated outfits with tee, shorts, and sneakers", () => {
    const outfits = getOutfitIdeas();
    expect(outfits.length).toBeGreaterThanOrEqual(3);
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

  it("includes Palace Stone Wash with Vans sneaker inspo", () => {
    const palace = getOutfitIdeas().find(
      (o) => o.id === "outfit-palace-stone-vans",
    );
    expect(palace).toBeTruthy();
    expect(palace!.sneakerInspo?.length).toBeGreaterThanOrEqual(2);
    const alt = palace!.sneakerInspo![0];
    const built = outfitPiecesWithSneaker(palace!, alt);
    expect(built.filter((p) => p.kind === "sneaker")).toHaveLength(1);
    expect(built.some((p) => p.slug === alt.slug)).toBe(true);
    expect(built.some((p) => p.slug === "palace-denim-short-stone-wash")).toBe(
      true,
    );
  });
});

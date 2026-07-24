import { describe, expect, it } from "vitest";
import {
  closetHasPersonalPiece,
  getPersonalCollection,
  mergePersonalCollection,
  personalCollectionKey,
} from "@/lib/wardrobe/personalCollection";
import type { ClosetItem } from "@/lib/wardrobe/types";

describe("personal collection", () => {
  it("loads spreadsheet pieces with images and sizes", () => {
    const items = getPersonalCollection();
    expect(items.length).toBeGreaterThanOrEqual(20);
    for (const item of items) {
      expect(item.image.length).toBeGreaterThan(4);
      expect(item.notes).toContain(personalCollectionKey(item.id));
    }
    const mochas = items.filter((i) => i.id.includes("j1-mocha"));
    const chicagos = items.filter((i) => i.id.includes("j1-chicago"));
    expect(mochas).toHaveLength(2);
    expect(chicagos).toHaveLength(2);
  });

  it("imports only missing pieces", () => {
    let n = 0;
    const newId = () => `id-${++n}`;
    const first = mergePersonalCollection([], newId);
    expect(first.added).toBe(getPersonalCollection().length);
    expect(first.skipped).toBe(0);

    const second = mergePersonalCollection(first.closet, newId);
    expect(second.added).toBe(0);
    expect(second.skipped).toBe(first.added);
    expect(closetHasPersonalPiece(second.closet, getPersonalCollection()[0]!)).toBe(
      true,
    );
  });

  it("keeps mocha doubles as separate closet rows", () => {
    let n = 0;
    const { closet } = mergePersonalCollection([], () => `id-${++n}`);
    const mochas = closet.filter((c: ClosetItem) =>
      (c.notes ?? "").includes("[pc:j1-mocha-"),
    );
    expect(mochas).toHaveLength(2);
  });
});

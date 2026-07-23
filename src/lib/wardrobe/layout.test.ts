import { describe, expect, it } from "vitest";
import { autoOrganizePieces, centerToOrigin, piecesFromClosetItems } from "@/lib/wardrobe/layout";
import { pieceBox } from "@/lib/wardrobe/exportFit";
import type { ClosetItem, FitPiece } from "@/lib/wardrobe/types";

function item(
  id: string,
  kind: ClosetItem["kind"],
  name = id,
): ClosetItem {
  return {
    id,
    kind,
    name,
    brand: "Test",
    image: "data:image/jpeg;base64,xx",
    addedAt: "2026-01-01T00:00:00.000Z",
  };
}

function piece(id: string, closetItemId: string): FitPiece {
  return {
    id,
    closetItemId,
    x: 10,
    y: 10,
    scale: 1,
    zIndex: 1,
  };
}

describe("fit layout", () => {
  it("centers origin from center point", () => {
    const { x, y } = centerToOrigin(50, 50, 1);
    // base size 28 → half is 14 → origin 36
    expect(x).toBeCloseTo(36, 5);
    expect(y).toBeCloseTo(36, 5);
  });

  it("stacks top above bottom above sneakers, centered", () => {
    const closet = [
      item("s1", "sneaker"),
      item("t1", "top"),
      item("b1", "bottom"),
    ];
    const byId = new Map(closet.map((c) => [c.id, c]));
    const organized = autoOrganizePieces(
      [piece("p1", "s1"), piece("p2", "t1"), piece("p3", "b1")],
      byId,
    );

    const top = organized.find((p) => p.closetItemId === "t1")!;
    const bottom = organized.find((p) => p.closetItemId === "b1")!;
    const sneaker = organized.find((p) => p.closetItemId === "s1")!;

    expect(top.y).toBeLessThan(bottom.y);
    expect(bottom.y).toBeLessThan(sneaker.y);
    // Roughly centered (origin near 50 - size/2)
    expect(top.x).toBeGreaterThan(20);
    expect(top.x).toBeLessThan(45);
    expect(top.rotation).toBe(0);
  });

  it("builds outfit pieces via kind slots, not array order", () => {
    // Sneaker first in array — should still land at the bottom of the stack.
    const items = [
      item("s1", "sneaker"),
      item("t1", "top"),
      item("b1", "bottom"),
    ];
    const pieces = piecesFromClosetItems(items, () => `id-${Math.random()}`);
    const top = pieces.find((p) => p.closetItemId === "t1")!;
    const sneaker = pieces.find((p) => p.closetItemId === "s1")!;
    expect(top.y).toBeLessThan(sneaker.y);
  });
});

describe("fit export math", () => {
  it("maps percent coords to pixel boxes", () => {
    const box = pieceBox(
      { id: "1", closetItemId: "c", x: 36, y: 20, scale: 1, zIndex: 1 },
      1080,
      1350,
    );
    expect(box.boxW).toBeCloseTo(1080 * 0.28, 5);
    expect(box.x).toBeCloseTo(1080 * 0.36, 5);
    expect(box.y).toBeCloseTo(1350 * 0.2, 5);
  });
});

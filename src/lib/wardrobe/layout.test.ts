import { describe, expect, it } from "vitest";
import { autoOrganizePieces, alignPiecesCenter, centerToOrigin, piecesBounds, piecesFromClosetItems, pullPiecesTogether } from "@/lib/wardrobe/layout";
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
    // base size 34 → half is 17 → origin 33
    expect(x).toBeCloseTo(33, 5);
    expect(y).toBeCloseTo(33, 5);
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
    // Tight stack — top and sneaker shouldn't be a full board apart
    expect(sneaker.y - top.y).toBeLessThan(55);
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

  it("aligns pieces to the vertical center", () => {
    const skewed = [
      { ...piece("p1", "t1"), x: 5, scale: 1 },
      { ...piece("p2", "b1"), x: 60, scale: 1 },
    ];
    const aligned = alignPiecesCenter(skewed);
    for (const p of aligned) {
      expect(p.x).toBeCloseTo(33, 5); // 50 - 34/2
    }
  });

  it("pulls pieces together and centers them", () => {
    const closet = [item("t1", "top"), item("b1", "bottom"), item("s1", "sneaker")];
    const byId = new Map(closet.map((c) => [c.id, c]));
    const spread = [
      { ...piece("p1", "t1"), x: 10, y: 5, scale: 1 },
      { ...piece("p2", "b1"), x: 70, y: 45, scale: 1 },
      { ...piece("p3", "s1"), x: 20, y: 80, scale: 1 },
    ];
    const beforeSpan =
      Math.max(...spread.map((p) => p.y)) - Math.min(...spread.map((p) => p.y));
    const pulled = pullPiecesTogether(spread, byId, 0.55);
    const afterSpan =
      Math.max(...pulled.map((p) => p.y)) - Math.min(...pulled.map((p) => p.y));
    expect(afterSpan).toBeLessThan(beforeSpan);
    // Group centered horizontally (allow small drift from clamp)
    const xs = pulled.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(2);
  });

  it("centers the whole outfit group on the board", () => {
    const closet = [item("t1", "top"), item("b1", "bottom"), item("s1", "sneaker")];
    const byId = new Map(closet.map((c) => [c.id, c]));
    const organized = autoOrganizePieces(
      [piece("p1", "t1"), piece("p2", "b1"), piece("p3", "s1")],
      byId,
    );
    const b = piecesBounds(organized);
    expect(b.cx).toBeCloseTo(50, 0);
    expect(b.cy).toBeCloseTo(50, 0);
  });
});

describe("fit export math", () => {
  it("maps percent coords to pixel boxes", () => {
    const box = pieceBox(
      { id: "1", closetItemId: "c", x: 36, y: 20, scale: 1, zIndex: 1 },
      1080,
      1080,
    );
    expect(box.boxW).toBeCloseTo(1080 * 0.34, 5);
    expect(box.x).toBeCloseTo(1080 * 0.36, 5);
    expect(box.y).toBeCloseTo(1080 * 0.2, 5);
  });
});

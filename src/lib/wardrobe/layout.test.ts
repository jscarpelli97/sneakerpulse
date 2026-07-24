import { describe, expect, it } from "vitest";
import {
  anyPiecesOverlap,
  autoOrganizePieces,
  alignPiecesCenter,
  centerToOrigin,
  FIT_EDGE_MARGIN,
  groupAndCenterPieces,
  piecesBounds,
  piecesFromClosetItems,
  pieceSize,
  pullPiecesTogether,
} from "@/lib/wardrobe/layout";
import {
  exportFilename,
  pieceBox,
  toExportImageSrc,
  toProxyImageSrc,
  upscaleRemoteImageUrl,
} from "@/lib/wardrobe/exportFit";
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
    expect(x).toBeCloseTo(33, 5);
    expect(y).toBeCloseTo(33, 5);
  });

  it("locks top → bottom → sneakers with no overlap and equal margins", () => {
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
    expect(anyPiecesOverlap(organized)).toBe(false);

    const b = piecesBounds(organized);
    expect(b.minX).toBeGreaterThanOrEqual(FIT_EDGE_MARGIN - 0.1);
    expect(b.minY).toBeGreaterThanOrEqual(FIT_EDGE_MARGIN - 0.1);
    expect(100 - b.maxX).toBeGreaterThanOrEqual(FIT_EDGE_MARGIN - 0.1);
    expect(100 - b.maxY).toBeGreaterThanOrEqual(FIT_EDGE_MARGIN - 0.1);
    // Left margin ≈ right margin, top ≈ bottom
    expect(Math.abs(b.minX - (100 - b.maxX))).toBeLessThan(0.5);
    expect(Math.abs(b.minY - (100 - b.maxY))).toBeLessThan(0.5);
    // Same scale / size for locked slots
    expect(pieceSize(top)).toBeCloseTo(pieceSize(bottom), 5);
    expect(pieceSize(bottom)).toBeCloseTo(pieceSize(sneaker), 5);
  });

  it("builds outfit pieces via kind slots, not array order", () => {
    const items = [
      item("s1", "sneaker"),
      item("t1", "top"),
      item("b1", "bottom"),
    ];
    const pieces = piecesFromClosetItems(items, () => `id-${Math.random()}`);
    const top = pieces.find((p) => p.closetItemId === "t1")!;
    const sneaker = pieces.find((p) => p.closetItemId === "s1")!;
    expect(top.y).toBeLessThan(sneaker.y);
    expect(anyPiecesOverlap(pieces)).toBe(false);
  });

  it("align / pull re-lock without overlap", () => {
    const closet = [item("t1", "top"), item("b1", "bottom"), item("s1", "sneaker")];
    const byId = new Map(closet.map((c) => [c.id, c]));
    const spread = [
      { ...piece("p1", "t1"), x: 10, y: 5, scale: 1.5 },
      { ...piece("p2", "b1"), x: 70, y: 40, scale: 1.5 },
      { ...piece("p3", "s1"), x: 20, y: 70, scale: 1.5 },
    ];
    const aligned = alignPiecesCenter(spread, byId);
    const pulled = pullPiecesTogether(spread, byId);
    expect(anyPiecesOverlap(aligned)).toBe(false);
    expect(anyPiecesOverlap(pulled)).toBe(false);
  });

  it("centers the locked group on the board", () => {
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

  it("groups three pieces into a tight centered stack", () => {
    const closet = [item("t1", "top"), item("b1", "bottom"), item("s1", "sneaker")];
    const byId = new Map(closet.map((c) => [c.id, c]));
    const spread = [
      { ...piece("p1", "t1"), x: 5, y: 5, scale: 1 },
      { ...piece("p2", "b1"), x: 60, y: 40, scale: 1 },
      { ...piece("p3", "s1"), x: 10, y: 70, scale: 1 },
    ];
    const grouped = groupAndCenterPieces(spread, byId);
    expect(grouped).toHaveLength(3);
    expect(anyPiecesOverlap(grouped)).toBe(false);

    const top = grouped.find((p) => p.closetItemId === "t1")!;
    const bottom = grouped.find((p) => p.closetItemId === "b1")!;
    const sneaker = grouped.find((p) => p.closetItemId === "s1")!;
    expect(top.y).toBeLessThan(bottom.y);
    expect(bottom.y).toBeLessThan(sneaker.y);

    const b = piecesBounds(grouped);
    expect(b.cx).toBeCloseTo(50, 0);
    expect(b.cy).toBeCloseTo(50, 0);
    // Tighter than full-board factory spread for 3 pieces.
    const factory = piecesBounds(autoOrganizePieces(spread, byId));
    expect(b.maxY - b.minY).toBeLessThan(factory.maxY - factory.minY - 1);
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

  it("builds same-origin export image URLs", () => {
    const remote = "https://images.stockx.com/x.jpg";
    expect(toExportImageSrc(remote)).toContain("/_next/image?url=");
    expect(toExportImageSrc(remote)).toContain("w=2048");
    expect(toExportImageSrc(remote)).toContain("q=100");
    expect(toProxyImageSrc(remote)).toContain("/api/wardrobe/image?url=");
    expect(toExportImageSrc("data:image/png;base64,xx")).toBe(
      "data:image/png;base64,xx",
    );
    expect(exportFilename("Mocha Fit")).toBe("mocha-fit-spi.jpg");
  });

  it("upscales capped StockX product thumbs for export", () => {
    const src =
      "https://images.stockx.com/images/x.jpg?fit=fill&w=700&h=500&fm=webp&auto=compress&q=90";
    const hi = upscaleRemoteImageUrl(src);
    expect(hi).toContain("w=1600");
    expect(hi).toContain("h=1200");
    expect(hi).toContain("fm=jpg");
    expect(hi).toContain("q=100");
    expect(hi).not.toContain("auto=compress");
  });
});

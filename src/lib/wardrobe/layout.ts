import type { ClosetItem, ClosetItemKind, FitPiece } from "@/lib/wardrobe/types";

/** Default piece width as % of the fit board (matches FitCanvas). */
export const FIT_BASE_SIZE = 34;

/** Stack order for a classic outfit read (top → bottom → footwear). */
export const FIT_KIND_STACK: ClosetItemKind[] = [
  "outerwear",
  "top",
  "bottom",
  "sneaker",
  "accessory",
  "other",
];

/** Board center (%). */
export const FIT_CENTER_X = 50;
export const FIT_CENTER_Y = 50;

/** Snap distance (board %) when dragging near the center guide. */
export const FIT_CENTER_SNAP = 3.5;

type Slot = {
  /** Relative center Y inside the stacked group (0 = top of group). */
  relY: number;
  scale: number;
};

/**
 * Relative stack — distances are small so cutouts sit as one outfit.
 * Group is then centered on the board (H + V).
 */
const KIND_SLOTS: Record<ClosetItemKind, Slot> = {
  outerwear: { relY: 0, scale: 1.05 },
  top: { relY: 0, scale: 1.08 },
  bottom: { relY: 26, scale: 1.05 },
  sneaker: { relY: 50, scale: 0.98 },
  accessory: { relY: 4, scale: 0.65 },
  other: { relY: 4, scale: 0.7 },
};

/** Convert center % → top-left origin used by FitPiece (matches canvas). */
export function centerToOrigin(
  cx: number,
  cy: number,
  scale: number,
): { x: number; y: number } {
  const size = FIT_BASE_SIZE * scale;
  return {
    x: Math.min(100 - size, Math.max(0, cx - size / 2)),
    y: Math.min(100 - size, Math.max(0, cy - size / 2)),
  };
}

export function pieceCenterX(piece: FitPiece) {
  const size = FIT_BASE_SIZE * piece.scale;
  return piece.x + size / 2;
}

export function pieceCenterY(piece: FitPiece) {
  const size = FIT_BASE_SIZE * piece.scale;
  return piece.y + size / 2;
}

export function pieceSize(piece: FitPiece) {
  return FIT_BASE_SIZE * piece.scale;
}

/** Snap a center-x toward the board midline when close enough. */
export function snapCenterX(cx: number, threshold = FIT_CENTER_SNAP) {
  return Math.abs(cx - FIT_CENTER_X) <= threshold ? FIT_CENTER_X : cx;
}

/** Bounding box of pieces in board % (top-left + size model). */
export function piecesBounds(pieces: FitPiece[]) {
  if (pieces.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, cx: 50, cy: 50 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pieces) {
    const s = pieceSize(p);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + s);
    maxY = Math.max(maxY, p.y + s);
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/**
 * Translate the whole group so its bounding-box center sits at board center.
 */
export function centerGroupOnBoard(pieces: FitPiece[]): FitPiece[] {
  if (pieces.length === 0) return pieces;
  const b = piecesBounds(pieces);
  const dx = FIT_CENTER_X - b.cx;
  const dy = FIT_CENTER_Y - b.cy;
  return pieces.map((p) => {
    const s = pieceSize(p);
    return {
      ...p,
      x: Math.min(100 - s, Math.max(0, p.x + dx)),
      y: Math.min(100 - s, Math.max(0, p.y + dy)),
    };
  });
}

/**
 * Auto-organize into a tight stack, then center the group on the board.
 */
export function autoOrganizePieces(
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
): FitPiece[] {
  const buckets = new Map<ClosetItemKind, FitPiece[]>();
  const orphans: FitPiece[] = [];

  for (const piece of pieces) {
    const item = closetById.get(piece.closetItemId);
    if (!item) {
      orphans.push(piece);
      continue;
    }
    const list = buckets.get(item.kind) ?? [];
    list.push(piece);
    buckets.set(item.kind, list);
  }

  // Build relative stack starting at y=0, then center as a group.
  const stacked: FitPiece[] = [];
  let z = 1;
  const hasOuter = (buckets.get("outerwear")?.length ?? 0) > 0;

  for (const kind of FIT_KIND_STACK) {
    const list = buckets.get(kind) ?? [];
    // If we have both outerwear and top, nudge top slightly down so they layer.
    const slot = KIND_SLOTS[kind];
    let relY = slot.relY;
    if (kind === "top" && hasOuter) relY = 8;
    if (kind === "accessory") {
      // Accessories sit to the side of the stack, still in the group.
      list.forEach((piece, index) => {
        const scale = slot.scale;
        const { x, y } = centerToOrigin(68 + index * 4, relY + 10, scale);
        stacked.push({
          ...piece,
          x,
          y,
          scale,
          rotation: 0,
          zIndex: z++,
        });
      });
      continue;
    }
    if (kind === "other") {
      list.forEach((piece, index) => {
        const scale = slot.scale;
        const { x, y } = centerToOrigin(32 - index * 4, relY + 10, scale);
        stacked.push({
          ...piece,
          x,
          y,
          scale,
          rotation: 0,
          zIndex: z++,
        });
      });
      continue;
    }

    list.forEach((piece, index) => {
      const spread = list.length > 1 ? (index - (list.length - 1) / 2) * 8 : 0;
      const scale = slot.scale;
      const { x, y } = centerToOrigin(FIT_CENTER_X + spread, relY + 18, scale);
      stacked.push({
        ...piece,
        x,
        y,
        scale,
        rotation: 0,
        zIndex: z++,
      });
    });
  }

  for (const piece of orphans) {
    const { x, y } = centerToOrigin(FIT_CENTER_X, 90, piece.scale || 1);
    stacked.push({ ...piece, x, y, zIndex: z++ });
  }

  return centerGroupOnBoard(stacked);
}

/**
 * Line everything up on the vertical center — keeps current Y / scale / rotation.
 */
export function alignPiecesCenter(pieces: FitPiece[]): FitPiece[] {
  return centerGroupOnBoard(
    pieces.map((piece) => {
      const { x } = centerToOrigin(FIT_CENTER_X, pieceCenterY(piece), piece.scale);
      return { ...piece, x };
    }),
  );
}

/**
 * Pull the stack tighter vertically, re-center the group on the board.
 */
export function pullPiecesTogether(
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
  factor = 0.45,
): FitPiece[] {
  if (pieces.length < 2) return alignPiecesCenter(pieces);

  const ranked = [...pieces].sort((a, b) => {
    const ka = closetById.get(a.closetItemId)?.kind;
    const kb = closetById.get(b.closetItemId)?.kind;
    const ra = ka ? FIT_KIND_STACK.indexOf(ka) : 99;
    const rb = kb ? FIT_KIND_STACK.indexOf(kb) : 99;
    if (ra !== rb) return ra - rb;
    return pieceCenterY(a) - pieceCenterY(b);
  });

  const centers = ranked.map((p) => pieceCenterY(p));
  const mid = (Math.min(...centers) + Math.max(...centers)) / 2;

  const pulled = ranked.map((piece) => {
    const cy = pieceCenterY(piece);
    const nextCy = mid + (cy - mid) * factor;
    const { x, y } = centerToOrigin(FIT_CENTER_X, nextCy, piece.scale);
    return { ...piece, x, y, rotation: 0 };
  });

  return centerGroupOnBoard(pulled);
}

/** Build pieces for a new fit from closet items (outfit ideas → board). */
export function piecesFromClosetItems(
  items: ClosetItem[],
  newPieceId: () => string,
): FitPiece[] {
  const draft: FitPiece[] = items.map((item, index) => ({
    id: newPieceId(),
    closetItemId: item.id,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    zIndex: index + 1,
  }));
  const byId = new Map(items.map((item) => [item.id, item]));
  return autoOrganizePieces(draft, byId);
}

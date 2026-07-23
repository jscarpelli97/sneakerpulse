import type { ClosetItem, ClosetItemKind, FitPiece } from "@/lib/wardrobe/types";

/**
 * Reference cell size as % of the board. Actual on-board size = FIT_BASE_SIZE * scale.
 * Auto-arrange picks scale so locked slots never overlap.
 */
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

/** Equal inset from every edge when locking pieces into slots. */
export const FIT_EDGE_MARGIN = 6;

/** Gap between locked slots (prevents touching / overlap). */
export const FIT_SLOT_GAP = 2.5;

/** Snap distance (board %) when dragging near the center guide. */
export const FIT_CENTER_SNAP = 3.5;

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

/** True if two axis-aligned piece boxes overlap (including touching counts as no). */
export function piecesOverlap(a: FitPiece, b: FitPiece, pad = 0.25): boolean {
  const as = pieceSize(a);
  const bs = pieceSize(b);
  return !(
    a.x + as <= b.x + pad ||
    b.x + bs <= a.x + pad ||
    a.y + as <= b.y + pad ||
    b.y + bs <= a.y + pad
  );
}

export function anyPiecesOverlap(pieces: FitPiece[]): boolean {
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (piecesOverlap(pieces[i]!, pieces[j]!)) return true;
    }
  }
  return false;
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

function orderedPieces(
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

  const ordered: FitPiece[] = [];
  for (const kind of FIT_KIND_STACK) {
    for (const piece of buckets.get(kind) ?? []) ordered.push(piece);
  }
  for (const piece of orphans) ordered.push(piece);
  return ordered;
}

/**
 * Lock pieces into equal vertical slots — no overlap, equal margins
 * top/bottom/left/right, each piece centered in its slot.
 */
export function autoOrganizePieces(
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
): FitPiece[] {
  const ordered = orderedPieces(pieces, closetById);
  const n = ordered.length;
  if (n === 0) return [];

  const margin = FIT_EDGE_MARGIN;
  const gap = n > 1 ? FIT_SLOT_GAP : 0;
  const usable = 100 - margin * 2;
  const slotH = (usable - gap * (n - 1)) / n;

  // Fit inside the slot with a little breathing room; also cap width so
  // left/right margins stay ≥ edge margin.
  const maxByHeight = slotH * 0.9;
  const maxByWidth = 100 - margin * 2;
  const size = Math.min(maxByHeight, maxByWidth);
  const scale = size / FIT_BASE_SIZE;

  return ordered.map((piece, i) => {
    const slotTop = margin + i * (slotH + gap);
    const cy = slotTop + slotH / 2;
    const { x, y } = centerToOrigin(FIT_CENTER_X, cy, scale);
    return {
      ...piece,
      x,
      y,
      scale,
      rotation: 0,
      zIndex: i + 1,
    };
  });
}

/**
 * Re-lock on the vertical center line (same as auto-arrange — keeps no-overlap).
 */
export function alignPiecesCenter(
  pieces: FitPiece[],
  closetById?: Map<string, ClosetItem>,
): FitPiece[] {
  if (closetById) return autoOrganizePieces(pieces, closetById);
  // Fallback: center X only when closet map isn't available.
  return pieces.map((piece) => {
    const { x } = centerToOrigin(FIT_CENTER_X, pieceCenterY(piece), piece.scale);
    return { ...piece, x };
  });
}

/**
 * Re-lock into equal non-overlapping slots (same as auto-arrange).
 */
export function pullPiecesTogether(
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
): FitPiece[] {
  return autoOrganizePieces(pieces, closetById);
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

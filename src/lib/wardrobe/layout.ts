import type { ClosetItem, ClosetItemKind, FitPiece } from "@/lib/wardrobe/types";

/** Default piece width as % of the fit board (matches FitCanvas). */
export const FIT_BASE_SIZE = 28;

/** Stack order for a classic outfit read (top → bottom → footwear). */
export const FIT_KIND_STACK: ClosetItemKind[] = [
  "outerwear",
  "top",
  "bottom",
  "sneaker",
  "accessory",
  "other",
];

/** Horizontal center of the board (%). */
export const FIT_CENTER_X = 50;

/** Snap distance (board %) when dragging near the center guide. */
export const FIT_CENTER_SNAP = 3.5;

type Slot = {
  /** Center X of the piece, 0–100. */
  cx: number;
  /** Center Y of the piece, 0–100. */
  cy: number;
  scale: number;
};

/**
 * Tight lookbook stack — pieces sit close so the fit reads as one outfit.
 * (Previously ~22 / 52 / 78 — too much air between layers.)
 */
const KIND_SLOTS: Record<ClosetItemKind, Slot> = {
  outerwear: { cx: FIT_CENTER_X, cy: 20, scale: 1.12 },
  top: { cx: FIT_CENTER_X, cy: 24, scale: 1.15 },
  bottom: { cx: FIT_CENTER_X, cy: 46, scale: 1.1 },
  sneaker: { cx: FIT_CENTER_X, cy: 68, scale: 1.02 },
  accessory: { cx: 72, cy: 22, scale: 0.72 },
  other: { cx: 28, cy: 22, scale: 0.75 },
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

/** Snap a center-x toward the board midline when close enough. */
export function snapCenterX(cx: number, threshold = FIT_CENTER_SNAP) {
  return Math.abs(cx - FIT_CENTER_X) <= threshold ? FIT_CENTER_X : cx;
}

/**
 * Auto-organize pieces into a tight centered stack:
 * outerwear/top → bottom → footwear.
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

  const next: FitPiece[] = [];
  let z = 1;

  for (const kind of FIT_KIND_STACK) {
    const list = buckets.get(kind) ?? [];
    const slot = KIND_SLOTS[kind];
    list.forEach((piece, index) => {
      // Slight fan for duplicates — keep them close, not spread across the board.
      const spread = list.length > 1 ? (index - (list.length - 1) / 2) * 10 : 0;
      const scale = slot.scale;
      const { x, y } = centerToOrigin(slot.cx + spread, slot.cy, scale);
      next.push({
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
    const { x, y } = centerToOrigin(FIT_CENTER_X, 88, piece.scale || 1);
    next.push({ ...piece, x, y, zIndex: z++ });
  }

  return next;
}

/**
 * Line everything up on the vertical center — keeps current Y / scale / rotation.
 */
export function alignPiecesCenter(pieces: FitPiece[]): FitPiece[] {
  return pieces.map((piece) => {
    const { x } = centerToOrigin(FIT_CENTER_X, pieceCenterY(piece), piece.scale);
    return { ...piece, x };
  });
}

/**
 * Pull the stack tighter vertically around its current midpoint,
 * then re-center horizontally. Good after free dragging left gaps.
 */
export function pullPiecesTogether(
  pieces: FitPiece[],
  closetById: Map<string, ClosetItem>,
  factor = 0.55,
): FitPiece[] {
  if (pieces.length < 2) return alignPiecesCenter(pieces);

  // Prefer kind order when available so tops stay above sneakers.
  const ranked = [...pieces].sort((a, b) => {
    const ka = closetById.get(a.closetItemId)?.kind;
    const kb = closetById.get(b.closetItemId)?.kind;
    const ra = ka ? FIT_KIND_STACK.indexOf(ka) : 99;
    const rb = kb ? FIT_KIND_STACK.indexOf(kb) : 99;
    if (ra !== rb) return ra - rb;
    return pieceCenterY(a) - pieceCenterY(b);
  });

  const centers = ranked.map((p) => pieceCenterY(p));
  const mid =
    (Math.min(...centers) + Math.max(...centers)) / 2;

  return ranked.map((piece) => {
    const cy = pieceCenterY(piece);
    const pulled = mid + (cy - mid) * factor;
    const { x, y } = centerToOrigin(FIT_CENTER_X, pulled, piece.scale);
    return { ...piece, x, y, rotation: 0 };
  });
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

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

type Slot = {
  /** Center X of the piece, 0–100. */
  cx: number;
  /** Center Y of the piece, 0–100. */
  cy: number;
  scale: number;
};

/**
 * Vertical slots for a clean lookbook stack.
 * Pieces are centered horizontally; multiple of the same kind fan sideways.
 */
const KIND_SLOTS: Record<ClosetItemKind, Slot> = {
  outerwear: { cx: 50, cy: 16, scale: 1.05 },
  top: { cx: 50, cy: 22, scale: 1.08 },
  bottom: { cx: 50, cy: 52, scale: 1.02 },
  sneaker: { cx: 50, cy: 78, scale: 0.95 },
  accessory: { cx: 78, cy: 18, scale: 0.7 },
  other: { cx: 22, cy: 18, scale: 0.75 },
};

function kindRank(kind: ClosetItemKind) {
  const i = FIT_KIND_STACK.indexOf(kind);
  return i === -1 ? FIT_KIND_STACK.length : i;
}

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

/**
 * Auto-organize pieces into a centered stack:
 * outerwear/top → bottom → footwear, accessories off to the side.
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
      // Fan multiples of the same kind horizontally so they don't fully overlap.
      const spread = list.length > 1 ? (index - (list.length - 1) / 2) * 18 : 0;
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

  // Missing closet refs — park at the bottom without breaking the stack.
  for (const piece of orphans) {
    const { x, y } = centerToOrigin(50, 90, piece.scale || 1);
    next.push({ ...piece, x, y, zIndex: z++ });
  }

  return next;
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

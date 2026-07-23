export type ClosetItemKind =
  | "sneaker"
  | "top"
  | "bottom"
  | "outerwear"
  | "accessory"
  | "other";

export const CLOSET_KIND_LABELS: Record<ClosetItemKind, string> = {
  sneaker: "Sneakers",
  top: "Tops",
  bottom: "Bottoms",
  outerwear: "Outerwear",
  accessory: "Accessories",
  other: "Other",
};

export const CLOSET_KINDS = Object.keys(CLOSET_KIND_LABELS) as ClosetItemKind[];

/** A piece in your wardrobe (sneaker from catalog or custom upload). */
export type ClosetItem = {
  id: string;
  kind: ClosetItemKind;
  name: string;
  brand: string;
  /** Remote StockX URL or compressed data URL for uploads. */
  image: string;
  slug?: string | null;
  styleCode?: string;
  size?: string;
  notes?: string;
  /** Optional link back to a portfolio holding. */
  holdingId?: string | null;
  addedAt: string;
};

/** One placed item on a fit board (percent coords). */
export type FitPiece = {
  id: string;
  closetItemId: string;
  /** 0–100, left origin of the piece. */
  x: number;
  /** 0–100, top origin of the piece. */
  y: number;
  /** Visual scale; 1 = default. */
  scale: number;
  zIndex: number;
};

export type FitBoard = {
  id: string;
  name: string;
  notes: string;
  pieces: FitPiece[];
  createdAt: string;
  updatedAt: string;
};

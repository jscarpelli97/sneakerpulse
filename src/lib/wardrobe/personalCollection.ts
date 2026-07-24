import collectionFile from "@/data/wardrobe/personal-collection.json";
import { getOfflineQuoteBySlug } from "@/services/catalog/offlineCatalog";
import type { ClosetItem, ClosetItemKind } from "@/lib/wardrobe/types";
import type { OutfitIdeaPiece } from "@/lib/wardrobe/outfitIdeas";

type CollectionFile = {
  note?: string;
  updatedAt?: string;
  items: OutfitIdeaPiece[];
};

const file = collectionFile as CollectionFile;

/** Stable marker embedded in notes so re-imports skip owned pieces. */
export function personalCollectionKey(id: string) {
  return `[pc:${id.replace(/^pc-/, "")}]`;
}

function normalizeItem(raw: OutfitIdeaPiece): OutfitIdeaPiece | null {
  if (!raw?.id || !raw?.name || !raw?.kind) return null;
  let image = raw.image?.trim() || "";
  let brand = raw.brand?.trim() || "—";
  let name = raw.name.trim();
  let styleCode = raw.styleCode?.trim() || undefined;
  const slug = raw.slug?.trim() || null;

  if (slug) {
    const offline = getOfflineQuoteBySlug(slug);
    if (offline) {
      name = offline.name || name;
      brand = offline.brand || brand;
      if (offline.styleCode && offline.styleCode !== "—") {
        styleCode = offline.styleCode;
      }
      if (!image && offline.fallbackImage) {
        image = offline.fallbackImage;
      }
    }
  }

  if (!image) return null;

  const key = personalCollectionKey(raw.id);
  const notes = raw.notes?.includes(key)
    ? raw.notes
    : [raw.notes, key].filter(Boolean).join(" · ");

  return {
    id: raw.id,
    kind: raw.kind as ClosetItemKind,
    name,
    brand,
    image,
    size: raw.size?.trim() || undefined,
    colorway: raw.colorway?.trim() || undefined,
    slug,
    styleCode,
    notes,
    source: raw.source || "personal",
  };
}

/** John's spreadsheet collection as wardrobe-ready pieces. */
export function getPersonalCollection(): OutfitIdeaPiece[] {
  const items: OutfitIdeaPiece[] = [];
  for (const raw of file.items ?? []) {
    const item = normalizeItem(raw);
    if (item) items.push(item);
  }
  return items;
}

export function closetHasPersonalPiece(
  closet: ClosetItem[],
  piece: OutfitIdeaPiece,
): boolean {
  const key = personalCollectionKey(piece.id);
  return closet.some((c) => (c.notes ?? "").includes(key));
}

export function personalPieceToClosetItem(
  piece: OutfitIdeaPiece,
  newId: () => string,
): ClosetItem {
  return {
    id: newId(),
    kind: piece.kind,
    name: piece.name,
    brand: piece.brand,
    image: piece.image,
    slug: piece.slug,
    styleCode: piece.styleCode,
    size: piece.size,
    notes: [piece.colorway, piece.notes].filter(Boolean).join(" · ") || undefined,
    addedAt: new Date().toISOString(),
  };
}

/** Add missing personal-collection pieces into an existing closet. */
export function mergePersonalCollection(
  closet: ClosetItem[],
  newId: () => string,
): { closet: ClosetItem[]; added: number; skipped: number } {
  const items = getPersonalCollection();
  let working = [...closet];
  let added = 0;
  let skipped = 0;
  for (const piece of items) {
    if (closetHasPersonalPiece(working, piece)) {
      skipped += 1;
      continue;
    }
    working = [personalPieceToClosetItem(piece, newId), ...working];
    added += 1;
  }
  return { closet: working, added, skipped };
}

import outfitFile from "@/data/wardrobe/outfit-ideas.json";
import { getOfflineQuoteBySlug } from "@/services/catalog/offlineCatalog";
import type { ClosetItemKind } from "@/lib/wardrobe/types";

export type OutfitIdeaPiece = {
  id: string;
  kind: ClosetItemKind;
  name: string;
  brand: string;
  image: string;
  size?: string;
  colorway?: string;
  slug?: string | null;
  styleCode?: string;
  notes?: string;
  source?: string;
  /** Short why-this-pair line for sneaker inspo options. */
  why?: string;
};

export type OutfitIdea = {
  id: string;
  name: string;
  blurb?: string;
  pieces: OutfitIdeaPiece[];
  /**
   * Extra sneaker options for the same tee/shorts.
   * Primary pick stays in `pieces`; these are alternatives.
   */
  sneakerInspo?: OutfitIdeaPiece[];
};

type OutfitFile = {
  note?: string;
  updatedAt?: string;
  outfits: Array<
    OutfitIdea & {
      sneakerInspo?: OutfitIdeaPiece[];
    }
  >;
};

const file = outfitFile as OutfitFile;

function normalizePiece(piece: OutfitIdeaPiece): OutfitIdeaPiece | null {
  if (!piece?.name || !piece?.kind) return null;
  let image = piece.image?.trim() || "";
  let brand = piece.brand?.trim() || "—";
  let name = piece.name.trim();
  let styleCode = piece.styleCode?.trim() || undefined;
  const slug = piece.slug?.trim() || null;

  if (slug) {
    const offline = getOfflineQuoteBySlug(slug);
    if (offline) {
      name = offline.name || name;
      brand = offline.brand || brand;
      if (offline.styleCode && offline.styleCode !== "—") {
        styleCode = offline.styleCode;
      }
      image = offline.fallbackImage || image;
    }
  }

  if (!image) return null;
  return {
    id: piece.id || `piece-${slug || name}`,
    kind: piece.kind,
    name,
    brand,
    image,
    size: piece.size?.trim() || undefined,
    colorway: piece.colorway?.trim() || undefined,
    slug,
    styleCode,
    notes: piece.notes,
    source: piece.source,
    why: piece.why?.trim() || undefined,
  };
}

/**
 * Curated outfit ideas (tees + shorts + sneakers).
 * Edit `src/data/wardrobe/outfit-ideas.json`, or send John another fit to append.
 */
export function getOutfitIdeas(): OutfitIdea[] {
  const outfits: OutfitIdea[] = [];
  for (const raw of file.outfits ?? []) {
    if (!raw?.id || !raw?.name || !Array.isArray(raw.pieces)) continue;
    const pieces: OutfitIdeaPiece[] = [];
    for (const piece of raw.pieces) {
      const normalized = normalizePiece(piece);
      if (normalized) pieces.push(normalized);
    }
    if (!pieces.length) continue;

    const sneakerInspo: OutfitIdeaPiece[] = [];
    for (const piece of raw.sneakerInspo ?? []) {
      const normalized = normalizePiece({ ...piece, kind: "sneaker" });
      if (normalized) sneakerInspo.push(normalized);
    }

    outfits.push({
      id: raw.id,
      name: raw.name.trim(),
      blurb: raw.blurb?.trim() || undefined,
      pieces,
      sneakerInspo: sneakerInspo.length ? sneakerInspo : undefined,
    });
  }
  return outfits;
}

/** Closet + fit pieces: apparel from the outfit, plus the chosen sneaker. */
export function outfitPiecesWithSneaker(
  outfit: OutfitIdea,
  sneaker: OutfitIdeaPiece,
): OutfitIdeaPiece[] {
  const apparel = outfit.pieces.filter((p) => p.kind !== "sneaker");
  return [...apparel, sneaker];
}

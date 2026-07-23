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
};

export type OutfitIdea = {
  id: string;
  name: string;
  blurb?: string;
  pieces: OutfitIdeaPiece[];
};

type OutfitFile = {
  note?: string;
  updatedAt?: string;
  outfits: OutfitIdea[];
};

const file = outfitFile as OutfitFile;

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
      if (!piece?.name || !piece?.kind) continue;
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

      if (!image) continue;
      pieces.push({
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
      });
    }
    if (!pieces.length) continue;
    outfits.push({
      id: raw.id,
      name: raw.name.trim(),
      blurb: raw.blurb?.trim() || undefined,
      pieces,
    });
  }
  return outfits;
}

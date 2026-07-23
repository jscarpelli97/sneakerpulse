import starterFile from "@/data/wardrobe/starter-closet.json";
import { getOfflineQuoteBySlug } from "@/services/catalog/offlineCatalog";
import type { ClosetItemKind } from "@/lib/wardrobe/types";

export type StarterClosetRow = {
  id: string;
  kind: ClosetItemKind;
  name: string;
  brand: string;
  image: string;
  slug?: string | null;
  styleCode?: string;
  notes?: string;
  source?: string;
};

type StarterFile = {
  note?: string;
  updatedAt?: string;
  count?: number;
  items: StarterClosetRow[];
};

const file = starterFile as StarterFile;

/**
 * Curated Wardrobe picks (sneakers from offline board + apparel placeholders).
 * Edit `src/data/wardrobe/starter-closet.json` — or ask the agent to add items.
 */
export function getStarterClosetItems(): StarterClosetRow[] {
  const rows: StarterClosetRow[] = [];
  for (const raw of file.items ?? []) {
    if (!raw?.name || !raw?.kind) continue;
    let image = raw.image?.trim() || "";
    let brand = raw.brand?.trim() || "—";
    let name = raw.name.trim();
    let styleCode = raw.styleCode?.trim() || "—";
    const slug = raw.slug?.trim() || null;

    if (slug) {
      const offline = getOfflineQuoteBySlug(slug);
      if (offline) {
        name = offline.name || name;
        brand = offline.brand || brand;
        styleCode =
          offline.styleCode && offline.styleCode !== "—"
            ? offline.styleCode
            : styleCode;
        image = offline.fallbackImage || image;
      }
    }

    if (!image) continue;
    rows.push({
      id: raw.id || `starter-${slug || name}`,
      kind: raw.kind,
      name,
      brand,
      image,
      slug,
      styleCode,
      notes: raw.notes,
      source: raw.source,
    });
  }
  return rows;
}

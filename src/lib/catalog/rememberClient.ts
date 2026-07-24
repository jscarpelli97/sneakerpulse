"use client";

import type { CatalogSearchHit } from "@/hooks/useCatalogSearch";
import type { PairSuggestion } from "@/components/markets/BoardPairPicker";

/** Persist a selected search hit to the local discovered catalog (best-effort). */
export function rememberCatalogHit(
  hit:
    | Pick<
        CatalogSearchHit,
        | "slug"
        | "name"
        | "brand"
        | "ticker"
        | "styleCode"
        | "fallbackImage"
        | "price"
        | "retail"
      >
    | PairSuggestion
    | null
    | undefined,
) {
  if (!hit?.slug || !hit.name) return;
  const payload = {
    slug: hit.slug,
    name: hit.name,
    brand: hit.brand,
    ticker: hit.ticker,
    styleCode: "styleCode" in hit ? hit.styleCode : undefined,
    fallbackImage: hit.fallbackImage,
    price: "price" in hit ? hit.price : null,
    retail: "retail" in hit ? hit.retail : null,
  };
  void fetch("/api/catalog/remember", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* ignore — selection should never fail because remember failed */
  });
}

"use client";

import { useEffect, useState } from "react";

export type CatalogSearchHit = {
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  fallbackImage: string;
  price?: number | null;
  retail?: number;
  source?: "live" | "snapshot";
};

/**
 * Debounced typeahead against `/api/catalog/search`.
 * Empty / short queries return `[]` (caller can show local suggestions).
 */
export function useCatalogSearch(query: string, enabled = true) {
  const [hits, setHits] = useState<CatalogSearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setBusy(false);
      setSource(null);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(q)}&limit=16`,
        );
        const json = (await res.json()) as {
          data?: CatalogSearchHit[];
          meta?: { source?: string };
        };
        if (!cancelled) {
          setHits(json.data ?? []);
          setSource(json.meta?.source ?? null);
        }
      } catch {
        if (!cancelled) {
          setHits([]);
          setSource(null);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, enabled]);

  return { hits, busy, source };
}

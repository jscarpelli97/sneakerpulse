import { apiGet } from "@/api/client";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";

export type CatalogApiResponse = {
  ok: boolean;
  data: CatalogQuote[];
  fetchedAt: string;
};

export function fetchCatalog() {
  return apiGet<CatalogApiResponse>("/api/catalog");
}

import { apiGet } from "@/api/client";
import type { MarketLoadResult } from "@/types/market";

export function fetchMarket(slug: string) {
  return apiGet<MarketLoadResult>(`/api/market/${slug}`);
}

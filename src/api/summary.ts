import { apiGet } from "@/api/client";
import type { MarketSummary } from "@/types/summary";

export type MarketSummaryApiResponse = {
  ok: boolean;
  slug?: string;
  ticker?: string;
  summary?: MarketSummary;
  error?: string;
  code?: string;
};

export function fetchMarketSummary(slug: string) {
  return apiGet<MarketSummaryApiResponse>(`/api/market/${slug}/summary`);
}

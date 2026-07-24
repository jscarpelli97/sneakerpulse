import { apiGet } from "@/api/client";
import type { MarketLoadResult, SizeAsk } from "@/types/market";

export function fetchMarket(slug: string) {
  return apiGet<MarketLoadResult>(`/api/market/${slug}`);
}

export type LiveSizeLadderResponse = {
  ok: boolean;
  data?: {
    slug: string;
    sizes: SizeAsk[];
    marketPrice: number | null;
    statsLowestAsk: number | null;
    live: boolean;
  };
  error?: string;
};

/** Live per-size asks for Deal — bypasses board snapshot mode. */
export function fetchMarketSizeLadder(slug: string) {
  return apiGet<LiveSizeLadderResponse>(
    `/api/market/${encodeURIComponent(slug)}/sizes`,
  );
}

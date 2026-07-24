import {
  searchEbayItemSummaries,
  type EbayItemSummary,
} from "@/lib/ebay/client";
import { ebayPublicEnabled, hasEbayCredentials } from "@/lib/ebay/config";
import {
  buildEbaySearchUrl,
  ebaySearchQuery,
} from "@/lib/ebay/searchUrl";
import type { EbayComps, EbayListingComp } from "@/types/market";

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function parseMoney(value?: string) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapListings(summaries: EbayItemSummary[] | undefined): EbayListingComp[] {
  return (summaries ?? [])
    .map((item) => {
      const price = parseMoney(item.price?.value);
      const shipping = parseMoney(
        item.shippingOptions?.[0]?.shippingCost?.value,
      );
      return {
        itemId: item.itemId ?? "",
        title: item.title ?? "eBay listing",
        price,
        currency: item.price?.currency ?? "USD",
        condition: item.condition ?? null,
        url: item.itemWebUrl ?? "",
        shipping,
      } satisfies EbayListingComp;
    })
    .filter((row) => row.itemId && row.url);
}

/**
 * Attach eBay comps when the public flag is on.
 * Without Browse API credentials, returns link-only (search URL).
 */
export async function getEbayCompsForProduct(input: {
  styleCode: string;
  name: string;
}): Promise<EbayComps | null> {
  if (!ebayPublicEnabled()) return null;

  const query = ebaySearchQuery(input.styleCode, input.name);
  const searchUrl = buildEbaySearchUrl({ query: query || input.name });

  if (!query) {
    return {
      status: "link_only",
      query: input.name,
      searchUrl: buildEbaySearchUrl({ query: input.name }),
      lowestAsk: null,
      medianAsk: null,
      listingCount: 0,
      listings: [],
      fetchedAt: null,
    };
  }

  if (!hasEbayCredentials()) {
    return {
      status: "link_only",
      query,
      searchUrl,
      lowestAsk: null,
      medianAsk: null,
      listingCount: 0,
      listings: [],
      fetchedAt: null,
    };
  }

  const result = await searchEbayItemSummaries({ query, limit: 20 });
  if (!result.ok) {
    return {
      status: "error",
      query,
      searchUrl,
      lowestAsk: null,
      medianAsk: null,
      listingCount: 0,
      listings: [],
      fetchedAt: new Date().toISOString(),
      error: result.error,
    };
  }

  const listings = mapListings(result.data.itemSummaries);
  const prices = listings
    .map((row) => row.price)
    .filter((n): n is number => typeof n === "number" && n > 0);

  return {
    status: "live",
    query,
    searchUrl,
    lowestAsk: prices.length ? Math.min(...prices) : null,
    medianAsk: median(prices),
    listingCount: result.data.total ?? listings.length,
    listings: listings.slice(0, 8),
    fetchedAt: new Date().toISOString(),
  };
}

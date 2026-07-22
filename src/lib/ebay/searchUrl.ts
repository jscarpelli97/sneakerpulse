/** Athletic Shoes category on eBay US. */
export const EBAY_ATHLETIC_SHOES_CATEGORY = "15709";

/**
 * Build a consumer eBay search URL for a style code / product name.
 * Always available — no API key required.
 */
export function buildEbaySearchUrl(input: {
  query: string;
  conditionNew?: boolean;
  categoryId?: string;
}): string {
  const q = input.query.trim();
  const url = new URL("https://www.ebay.com/sch/i.html");
  url.searchParams.set("_nkw", q);
  url.searchParams.set("_sacat", input.categoryId ?? EBAY_ATHLETIC_SHOES_CATEGORY);
  url.searchParams.set("_sop", "15"); // Price + Shipping: lowest first
  if (input.conditionNew !== false) {
    // New (or New with tags) — reduces used/fakes noise for comps.
    url.searchParams.set("LH_ItemCondition", "1000");
  }
  return url.toString();
}

export function ebaySearchQuery(styleCode: string, name?: string) {
  const sku = styleCode.trim();
  if (sku && sku !== "—") return sku;
  return (name ?? "").trim();
}

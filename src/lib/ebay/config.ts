/**
 * Public eBay comps panel on market pages.
 * Off by default — set NEXT_PUBLIC_EBAY_PUBLIC=1 (and/or EBAY_PUBLIC=1) to show.
 * Live asks also need EBAY_CLIENT_ID + EBAY_CLIENT_SECRET (Browse API).
 */
export function ebayPublicEnabled() {
  const v = (
    process.env.NEXT_PUBLIC_EBAY_PUBLIC ??
    process.env.EBAY_PUBLIC ??
    ""
  )
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function getEbayCredentials() {
  const clientId = process.env.EBAY_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.EBAY_CLIENT_SECRET?.trim() || "";
  if (!clientId || !clientSecret) return null;

  const env = (process.env.EBAY_ENV?.trim() || "production").toLowerCase();
  const sandbox = env === "sandbox" || env === "dev" || env === "development";

  return {
    clientId,
    clientSecret,
    sandbox,
    marketplaceId:
      process.env.EBAY_MARKETPLACE_ID?.trim() || "EBAY_US",
  };
}

export function hasEbayCredentials() {
  return getEbayCredentials() != null;
}

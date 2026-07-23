/** Public product brand (distinct from repo / Vercel project slug). */
export const BRAND_NAME = "SPI Markets";
export const BRAND_SHORT = "SPI";

/**
 * SPI = Sneaker Price Index — original index for this product.
 * INDEX_NAME is the ticker-style short form shown in UI chrome.
 */
export const INDEX_NAME = "SPI";
export const INDEX_EXPANSION = "Sneaker Price Index";
export const INDEX_LONG_NAME = "Sneaker Price Index";

/** Short line for titles, OG, PWA — plain English. */
export const BRAND_TAGLINE = "See what sneakers are selling for";

/**
 * One-paragraph description for SEO, About, and LinkedIn.
 * Soft-launch focus: board + SPI + portfolio (original plan).
 */
export const BRAND_BLURB =
  "SPI Markets shows current prices for popular sneakers and the Sneaker Price Index (SPI) — an original score for how expensive the market is vs retail — plus a simple portfolio to track what you own. Independent and honest about the data.";

/** Public site origin — prefer custom domain in production. */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://spimarkets.com";
}

/** Human behind the project — day-1 trust signal. */
export const FOUNDER_NAME = "John Scarpelli";
export const FOUNDER_ROLE = "Founder";

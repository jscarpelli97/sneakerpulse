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
 * Soft-launch pillars (rule of three) + room for more later.
 * One-paragraph description for SEO, About, and LinkedIn.
 */
export const BRAND_BLURB =
  "SPI Markets: see what popular sneakers are selling for, check the Sneaker Price Index (SPI), and track what you own — with more on the way. Independent and honest about the data.";

/** The three soft-launch pillars — keep marketing in threes. */
export const SOFT_LAUNCH_PILLARS = [
  {
    title: "Price board",
    body: "Current prices for popular sneakers in one place.",
  },
  {
    title: "Sneaker Price Index",
    body: "SPI — how expensive the market is vs retail (100 ≈ retail).",
  },
  {
    title: "Portfolio",
    body: "Track what you own and what you paid vs today’s prices.",
  },
] as const;

export const SOFT_LAUNCH_MORE =
  "Compare, alerts, wardrobe, and more are already in progress — this is just the start.";

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

/** Public product brand (distinct from repo / Vercel project slug). */
export const BRAND_NAME = "SPI Markets";
export const BRAND_SHORT = "SPI";

/** Premium-vs-retail index shown on the homepage. */
export const INDEX_NAME = "SPI";
export const INDEX_LONG_NAME = "SPI Index";

/** Short line for titles, OG, PWA — plain English. */
export const BRAND_TAGLINE = "See what sneakers are selling for";

/**
 * One-paragraph description for SEO, About, and LinkedIn.
 * Avoids trader jargon (tape / asks / terminal).
 */
export const BRAND_BLURB =
  "SPI Markets shows current prices for popular sneakers, how expensive the market is compared to retail, and tools to track what you own — including outfit boards. Independent, honest about the data, built for people who actually wear and collect shoes.";

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

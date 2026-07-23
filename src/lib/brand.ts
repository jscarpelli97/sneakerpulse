/** Public product brand (distinct from repo / Vercel project slug). */
export const BRAND_NAME = "SPI Markets";
export const BRAND_SHORT = "SPI";

/** Premium-vs-retail index shown on the homepage. */
export const INDEX_NAME = "SPI";
export const INDEX_LONG_NAME = "SPI Index";

export const BRAND_TAGLINE =
  "Ask board and premium index for sneakers";

export const BRAND_BLURB =
  "Independent markets terminal for sneaker asks — plus the SPI premium-vs-retail index. Built for the love of the game: clean tape, honest data, no hype machine.";

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

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
export const BRAND_TAGLINE =
  "Sneaker prices, the index, and your collection — in one place";

/**
 * One-paragraph description for SEO, About, and LinkedIn.
 * Covers what’s live today without underselling.
 */
export const BRAND_BLURB =
  "SPI Markets tracks what sneakers are selling for, how expensive the market is vs retail (SPI), and what you own or wear — with deal checks, compares, and alerts on top. Independent and honest about the data.";

/** Hero supporting line under the brand name. */
export const BRAND_HERO_LINE =
  "Start with the index. Dig into the board. Track what you own and wear.";

/**
 * Core product doors — thesis, workbench, yours.
 * Keep marketing focused on these four.
 */
export const PRODUCT_PILLARS = [
  {
    title: "Sneaker Price Index",
    href: "/spi",
    body: "Is the market cheap or rich vs retail? 100 ≈ retail.",
  },
  {
    title: "Price board",
    href: "/markets",
    body: "Top sellers, size asks, charts, and buy/stretch/pass on every pair.",
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    body: "What you own — marked to your size’s ask, not the all-size low.",
  },
  {
    title: "Wardrobe",
    href: "/wardrobe",
    body: "Closet + fits from real outfit ideas.",
  },
] as const;

/** Helper tools — secondary nav / About. */
export const PRODUCT_TOOLS = [
  {
    title: "Deal check",
    body: "Size + price → buy, stretch, or pass vs that size’s ask.",
  },
  {
    title: "Compare",
    href: "/compare",
    body: "Stack two pairs on ask, retail, premium, and flow.",
  },
  {
    title: "Alerts",
    href: "/alerts",
    body: "Browser alerts when an ask crosses your level.",
  },
] as const;

/** @deprecated Prefer PRODUCT_PILLARS — kept for any stale imports. */
export const SOFT_LAUNCH_PILLARS = PRODUCT_PILLARS;

/** Short line for footers / About closing. */
export const PRODUCT_FOOTNOTE =
  "SPI · markets · portfolio · wardrobe — with deal checks, compare, and alerts on the board.";

/** @deprecated Prefer PRODUCT_FOOTNOTE */
export const SOFT_LAUNCH_MORE = PRODUCT_FOOTNOTE;

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

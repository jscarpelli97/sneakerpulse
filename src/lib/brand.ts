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
  "Sneaker Price Index, asks, and your collection — in one place";

/**
 * One-paragraph description for SEO, About, and LinkedIn.
 * Covers what’s live today without underselling.
 */
export const BRAND_BLURB =
  "SPI Markets is the Sneaker Price Index (SPI) plus a board of asks — so you can see if the market is cheap or rich vs retail, check deals on pairs, and track what you own or wear. Independent of StockX.";

/**
 * Hero answer to “what is this?” — identity in one breath.
 */
export const BRAND_HERO_LINE =
  "SPI = Sneaker Price Index: one score for how expensive popular sneakers are vs retail, then a board of asks you can act on.";

/**
 * Hero answer to “why not just use StockX?”
 */
export const BRAND_VALUE_LINE =
  "StockX shows a listing. We show whether the market is cheap or rich, whether your size is a deal, and what your collection is actually worth.";

/**
 * Core product doors — thesis, workbench, yours.
 * Keep marketing focused on these four.
 */
export const PRODUCT_PILLARS = [
  {
    title: "Collection",
    href: "/collection",
    body: "Portfolio value and wardrobe fits — what you own and wear, one account.",
  },
  {
    title: "Price board",
    href: "/markets",
    body: "Top sellers with size asks, charts, compare, and deal check — cop / stretch / pass from the board.",
  },
  {
    title: "Sneaker Price Index",
    href: "/spi",
    body: "One number for how expensive the market is vs retail. 100 ≈ retail — something a single StockX page can’t tell you.",
  },
] as const;

/** Helper tools — built into Markets (secondary nav / About / Plus). */
export const PRODUCT_TOOLS = [
  {
    title: "Compare",
    href: "/markets?view=compare",
    body: "Type to search any pair (catalog only after 2+ characters) or quick-pick top sellers — stack up to five on ask, retail, premium, and flow.",
  },
  {
    title: "Deal check",
    href: "/markets?view=deal",
    body: "Search any pair when you type — or pick a top seller — then size + offer → cop, stretch, or pass.",
  },
] as const;

/** @deprecated Prefer PRODUCT_PILLARS — kept for any stale imports. */
export const SOFT_LAUNCH_PILLARS = PRODUCT_PILLARS;

/** Short line for footers / About closing. */
export const PRODUCT_FOOTNOTE =
  "Index · Markets · Collection — SPI, asks, and what you own or wear.";

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

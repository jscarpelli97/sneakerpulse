/** Public product brand (distinct from repo / Vercel project slug). */
export const BRAND_NAME = "SPI Markets";
export const BRAND_SHORT = "SPI";

/** Prior public name — keep visible so StockX / partners can match the app. */
export const BRAND_FORMER_NAME = "SneakerPulse";

/** e.g. "SPI Markets (formerly SneakerPulse)" */
export const BRAND_NAME_WITH_FORMER = `${BRAND_NAME} (formerly ${BRAND_FORMER_NAME})`;

/** Premium-vs-retail index shown on the homepage. */
export const INDEX_NAME = "SPI";
export const INDEX_LONG_NAME = "SPI Index";

export const BRAND_TAGLINE =
  "Ask board and premium index for sneakers & streetwear";

export const BRAND_BLURB =
  "Independent markets terminal for sneaker and streetwear asks — plus the SPI premium-vs-retail index. Built to grow beyond sneakers into apparel.";

/**
 * Clothing / streetwear board in nav.
 * Off by default — set NEXT_PUBLIC_CLOTHING_PUBLIC=1 to show again.
 */
export function clothingPublicEnabled() {
  const v = (
    process.env.NEXT_PUBLIC_CLOTHING_PUBLIC ??
    process.env.CLOTHING_PUBLIC ??
    ""
  )
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

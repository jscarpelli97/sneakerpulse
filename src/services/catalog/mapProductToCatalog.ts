import type { KicksProduct, KicksTrait } from "@/types/kicksdb";
import type { SneakerCatalogEntry } from "@/types/catalog";

/** Tracked StockX sneaker universe (sales rank). */
export const TOP_SELLERS_LIMIT = 500;
/** Homepage watchlist rows. */
export const HOMEPAGE_WATCHLIST_LIMIT = 10;
/** Pre-render this many market pages at build; rest use dynamicParams. */
export const STATIC_PARAMS_LIMIT = 50;

export function traitValue(
  traits: KicksTrait[] | null | undefined,
  name: string,
): string | null {
  const hit = traits?.find(
    (trait) => trait.trait.toLowerCase() === name.toLowerCase(),
  );
  const value = hit?.value?.trim();
  return value ? value : null;
}

/** Build a short display ticker from the shoe name when no SKU exists. */
export function tickerFromName(title: string, slug = ""): string {
  let words: string[] = title.toUpperCase().match(/[A-Z0-9]+/g) ?? [];

  // Drop leading brand tokens so the ticker reads like the model + colorway.
  if (words[0] === "BRAVEST" && words[1] === "STUDIOS") {
    words = words.slice(2);
  } else if (words[0] === "YZY" || words[0] === "YEEZY") {
    words = words.slice(1);
  } else if (words.length >= 3) {
    words = words.slice(1);
  }

  const fromName = words.join("").slice(0, 10);
  if (fromName.length >= 3) return fromName;

  const parts = slug.toLowerCase().split("-").filter(Boolean);
  let start = 0;
  if (parts[0] === "yzy") start = 1;
  if (parts[0] === "bravest" && parts[1] === "studios") start = 2;
  const fromSlug = parts
    .slice(start)
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  if (fromSlug.length >= 3) return fromSlug;

  return (slug || title || "SHOE")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 10);
}

export function makeTicker(product: KicksProduct): string {
  const sku = product.sku?.trim();
  if (sku) {
    return sku.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || sku;
  }

  // No SKU (common for YZY drops) — derive from the shoe name, not sales rank.
  return tickerFromName(product.title || "", product.slug ?? product.id ?? "");
}

export function mapListedProductToCatalog(
  product: KicksProduct,
  options?: { featured?: boolean },
): SneakerCatalogEntry | null {
  const slug = product.slug?.trim();
  if (!slug) return null;

  const releaseDate =
    traitValue(product.traits, "Release Date") ??
    `${new Date().getUTCFullYear()}-01-01`;
  const yearMatch = releaseDate.match(/^(\d{4})/);
  const retailRaw = traitValue(product.traits, "Retail Price");
  const retail = retailRaw != null ? Number(retailRaw) : 0;

  return {
    slug,
    ticker: makeTicker(product),
    styleCode: product.sku?.trim() || slug,
    name: product.title || slug,
    brand: product.brand || "Unknown",
    year: yearMatch ? Number(yearMatch[1]) : new Date().getUTCFullYear(),
    releaseDate,
    colorway: traitValue(product.traits, "Colorway") ?? "—",
    retail: Number.isFinite(retail) ? retail : 0,
    stockxUrl: `https://stockx.com/${slug}`,
    fallbackImage:
      product.image ||
      "https://images.stockx.com/image-placeholder.jpg?fit=fill&bg=FFFFFF&w=700&h=500",
    featured: options?.featured ?? product.rank === 1,
    rank: product.rank ?? null,
  };
}

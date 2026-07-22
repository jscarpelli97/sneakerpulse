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

export function makeTicker(product: KicksProduct): string {
  const sku = product.sku?.trim();
  if (sku) {
    return sku.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || sku;
  }
  if (product.rank != null) {
    return `TOP${product.rank}`;
  }
  const slug = product.slug ?? product.id;
  return slug.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
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

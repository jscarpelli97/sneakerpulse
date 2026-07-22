import clothingFile from "@/data/catalog/clothing.json";
import type { SneakerCatalogEntry } from "@/types/catalog";
import type { CatalogQuote } from "@/services/market/getCatalogQuotes";

export type ClothingKind =
  | "hoodie"
  | "tee"
  | "jacket"
  | "pants"
  | "crewneck"
  | "other";

export type ClothingCatalogEntry = SneakerCatalogEntry & {
  category: "clothing";
  kind: ClothingKind | string;
};

type ClothingProduct = ClothingCatalogEntry & {
  price: number | null;
  weeklyOrders: number | null;
  live?: boolean;
};

type ClothingCatalogFile = {
  asOf?: string;
  updatedAt?: string;
  count?: number;
  note?: string;
  products?: ClothingProduct[];
};

const file = clothingFile as ClothingCatalogFile;

export function getClothingCatalogAsOf() {
  return file.asOf ?? file.updatedAt?.slice(0, 10) ?? null;
}

export function getClothingCatalogNote() {
  return file.note ?? null;
}

export function getClothingCatalogEntries(
  limit = Number.POSITIVE_INFINITY,
): ClothingCatalogEntry[] {
  const products = file.products ?? [];
  return products.slice(0, limit).map((product) => ({
    slug: product.slug,
    ticker: product.ticker,
    styleCode: product.styleCode,
    name: product.name,
    brand: product.brand,
    year: product.year,
    releaseDate: product.releaseDate,
    colorway: product.colorway,
    retail: product.retail,
    stockxUrl: product.stockxUrl,
    fallbackImage: product.fallbackImage,
    featured: product.featured,
    rank: product.rank ?? null,
    category: "clothing",
    kind: product.kind ?? "other",
  }));
}

export function getClothingCatalogQuotes(
  limit = Number.POSITIVE_INFINITY,
): CatalogQuote[] {
  const products = file.products ?? [];
  return products.slice(0, limit).map((product) => ({
    slug: product.slug,
    ticker: product.ticker,
    styleCode: product.styleCode,
    name: product.name,
    brand: product.brand,
    year: product.year,
    releaseDate: product.releaseDate,
    colorway: product.colorway,
    retail: product.retail,
    stockxUrl: product.stockxUrl,
    fallbackImage: product.fallbackImage,
    featured: product.featured,
    rank: product.rank ?? null,
    price: product.price ?? null,
    weeklyOrders: product.weeklyOrders ?? null,
    live: Boolean(product.live),
  }));
}

export function getClothingBySlug(slug: string): ClothingCatalogEntry | null {
  return (
    getClothingCatalogEntries().find((row) => row.slug === slug) ?? null
  );
}

export function getAllClothingSlugs() {
  return getClothingCatalogEntries().map((row) => row.slug);
}

import type { KicksProduct } from "@/types/kicksdb";

/** ChronoPulse mirror: up to 14 brands × 10 models = 140 constituents. */
export const SPI_BRAND_COUNT = 14;
export const SPI_MODELS_PER_BRAND = 10;
export const SPI_REBALANCE_MONTHS = 6;

export type SpiBasketMember = {
  slug: string;
  brand: string;
  name: string;
  weight: number;
  rank: number | null;
};

export type SpiBasketChange = {
  date: string;
  added: string[];
  removed: string[];
};

export type SpiChronoBasket = {
  id: string;
  name: string;
  methodology: "chronopulse_laspeyres";
  brandCount: number;
  modelsPerBrand: number;
  rebalancedAt: string;
  nextRebalanceAt: string;
  members: SpiBasketMember[];
  brands: Array<{ brand: string; models: number; weight: number }>;
  changes: SpiBasketChange[];
};

function brandKey(product: KicksProduct) {
  return (product.brand ?? "Unknown").trim() || "Unknown";
}

function volume(product: KicksProduct) {
  return Math.max(0, product.weekly_orders ?? 0);
}

function addMonths(isoDay: string, months: number): string {
  const [y, m, d] = isoDay.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

/**
 * ChronoPulse-style selection from a ranked StockX sneaker pool:
 * 1) rank brands by total transaction volume (weekly_orders proxy)
 * 2) take up to SPI_BRAND_COUNT brands
 * 3) within each brand, take up to SPI_MODELS_PER_BRAND bestsellers
 * Each model is weighted by its volume for Laspeyres.
 */
export function selectChronoBasket(
  products: KicksProduct[],
  options?: {
    brandCount?: number;
    modelsPerBrand?: number;
    rebalancedAt?: string;
    previous?: SpiChronoBasket | null;
  },
): SpiChronoBasket {
  const brandCount = options?.brandCount ?? SPI_BRAND_COUNT;
  const modelsPerBrand = options?.modelsPerBrand ?? SPI_MODELS_PER_BRAND;
  const rebalancedAt =
    options?.rebalancedAt ?? new Date().toISOString().slice(0, 10);

  const byBrand = new Map<string, KicksProduct[]>();
  for (const product of products) {
    if (!product.slug?.trim()) continue;
    const key = brandKey(product);
    const list = byBrand.get(key) ?? [];
    list.push(product);
    byBrand.set(key, list);
  }

  const brandTotals = [...byBrand.entries()]
    .map(([brand, items]) => ({
      brand,
      items: items
        .slice()
        .sort((a, b) => volume(b) - volume(a) || (a.rank ?? 999) - (b.rank ?? 999)),
      weight: items.reduce((sum, item) => sum + volume(item), 0),
    }))
    .sort(
      (a, b) =>
        b.weight - a.weight || a.brand.localeCompare(b.brand),
    )
    .slice(0, brandCount);

  const members: SpiBasketMember[] = [];
  const brands: SpiChronoBasket["brands"] = [];

  for (const row of brandTotals) {
    const picked = row.items.slice(0, modelsPerBrand);
    let brandWeight = 0;
    for (const product of picked) {
      const weight = Math.max(1, volume(product));
      brandWeight += weight;
      members.push({
        slug: product.slug!,
        brand: row.brand,
        name: product.title?.trim() || product.slug!,
        weight,
        rank: product.rank ?? null,
      });
    }
    brands.push({
      brand: row.brand,
      models: picked.length,
      weight: brandWeight,
    });
  }

  const prevSlugs = new Set(options?.previous?.members.map((m) => m.slug) ?? []);
  const nextSlugs = new Set(members.map((m) => m.slug));
  const added = members.map((m) => m.slug).filter((slug) => !prevSlugs.has(slug));
  const removed = [...prevSlugs].filter((slug) => !nextSlugs.has(slug));

  const prevChanges = options?.previous?.changes ?? [];
  const changes =
    options?.previous && (added.length || removed.length)
      ? [
          ...prevChanges,
          { date: rebalancedAt, added, removed },
        ].slice(-12)
      : prevChanges;

  return {
    id: "spi-chronopulse-basket",
    name: "SPI ChronoPulse basket",
    methodology: "chronopulse_laspeyres",
    brandCount: brands.length,
    modelsPerBrand,
    rebalancedAt,
    nextRebalanceAt: addMonths(rebalancedAt, SPI_REBALANCE_MONTHS),
    members,
    brands,
    changes,
  };
}

export function basketNeedsRebalance(
  basket: SpiChronoBasket | null | undefined,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (!basket?.members?.length || !basket.nextRebalanceAt) return true;
  return today >= basket.nextRebalanceAt.slice(0, 10);
}

export function filterProductsToBasket(
  products: KicksProduct[],
  basket: SpiChronoBasket,
): KicksProduct[] {
  const want = new Set(basket.members.map((m) => m.slug));
  const weightBySlug = new Map(
    basket.members.map((m) => [m.slug, m.weight] as const),
  );
  return products
    .filter((product) => product.slug && want.has(product.slug))
    .map((product) => {
      const weight = weightBySlug.get(product.slug!);
      if (weight == null) return product;
      // Prefer frozen rebalance weights for Laspeyres stability between rebalances.
      return { ...product, weekly_orders: weight };
    });
}

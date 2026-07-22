export type SneakerCatalogEntry = {
  slug: string;
  ticker: string;
  styleCode: string;
  name: string;
  brand: string;
  year: number;
  /** ISO date (YYYY-MM-DD) of original retail release */
  releaseDate: string;
  colorway: string;
  retail: number;
  stockxUrl: string;
  fallbackImage: string;
  featured?: boolean;
};

/**
 * Tracked sneakers. Add entries here to expose new market pages at
 * /sneakers/[slug].
 */
export const SNEAKERS: SneakerCatalogEntry[] = [
  {
    slug: "air-jordan-1-retro-high-dark-mocha",
    ticker: "J1-DMCH",
    styleCode: "555088-105",
    name: "Jordan 1 High Dark Mocha",
    brand: "Jordan",
    year: 2020,
    releaseDate: "2020-10-31",
    colorway: "Sail / Dark Mocha / Black",
    retail: 170,
    stockxUrl: "https://stockx.com/air-jordan-1-retro-high-dark-mocha",
    fallbackImage:
      "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Dark-Mocha-2-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
    featured: true,
  },
  {
    slug: "air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found",
    ticker: "J1-LNF",
    styleCode: "DZ5485-612",
    name: "Jordan 1 High OG Chicago Lost & Found",
    brand: "Jordan",
    year: 2022,
    releaseDate: "2022-11-19",
    colorway: "Varsity Red / Black / Sail / Muslin",
    retail: 180,
    stockxUrl:
      "https://stockx.com/air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found",
    fallbackImage:
      "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
  },
  {
    slug: "nike-dunk-low-retro-white-black-2021",
    ticker: "DNK-PNDA",
    styleCode: "DD1391-100",
    name: "Nike Dunk Low Retro White Black Panda",
    brand: "Nike",
    year: 2021,
    releaseDate: "2021-03-10",
    colorway: "White / Black",
    retail: 100,
    stockxUrl: "https://stockx.com/nike-dunk-low-retro-white-black-2021",
    fallbackImage:
      "https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
  },
  {
    slug: "adidas-samba-og-cloud-white-core-black",
    ticker: "SMB-CWCB",
    styleCode: "B75806",
    name: "adidas Samba OG Cloud White Core Black",
    brand: "adidas",
    year: 2018,
    releaseDate: "2018-01-01",
    colorway: "Cloud White / Core Black / Clear Granite",
    retail: 100,
    stockxUrl: "https://stockx.com/adidas-samba-og-cloud-white-core-black",
    fallbackImage:
      "https://images.stockx.com/images/adidas-Samba-OG-Cloud-White-Core-Black-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
  },
];

const bySlug = new Map(SNEAKERS.map((sneaker) => [sneaker.slug, sneaker]));

export function getSneakerBySlug(slug: string) {
  return bySlug.get(slug) ?? null;
}

export function getAllSneakerSlugs() {
  return SNEAKERS.map((sneaker) => sneaker.slug);
}

export function getFeaturedSneaker() {
  return SNEAKERS.find((sneaker) => sneaker.featured) ?? SNEAKERS[0];
}

export const CHART_RANGES = ["1D", "7D", "1M", "3M", "1Y", "ALL"] as const;

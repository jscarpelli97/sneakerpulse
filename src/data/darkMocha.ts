/**
 * Static catalog identity for Jordan 1 High Dark Mocha (2020).
 * Live market fields come from KicksDB/StockX at request time.
 */
export const DARK_MOCHA = {
  slug: "air-jordan-1-retro-high-dark-mocha",
  ticker: "J1-DMCH",
  styleCode: "555088-105",
  name: "Jordan 1 High Dark Mocha",
  brand: "Jordan",
  year: 2020,
  colorway: "Sail / Dark Mocha / Black",
  retail: 170,
  stockxUrl: "https://stockx.com/air-jordan-1-retro-high-dark-mocha",
  /** Fallback product image from StockX CDN (used until live payload returns). */
  fallbackImage:
    "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Dark-Mocha-2-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
} as const;

export const CHART_RANGES = ["1D", "7D", "1M", "3M", "1Y", "ALL"] as const;

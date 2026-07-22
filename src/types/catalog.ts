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
  /** StockX sales rank when known (1 = top seller) */
  rank?: number | null;
};

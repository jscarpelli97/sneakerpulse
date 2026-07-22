/**
 * Price-history contracts aligned with `db/schema.sql`.
 * Ready for a future Postgres-backed collector without changing live JSON snapshots yet.
 */

export type MarketplaceCode = "stockx" | "goat" | (string & {});

export type SneakerRecord = {
  id: string;
  slug: string;
  styleCode: string | null;
  ticker: string | null;
  name: string;
  brand: string | null;
  colorway: string | null;
  retailPrice: number | null;
  releaseDate: string | null;
};

/**
 * One historical market observation for a sneaker on a marketplace.
 */
export type PriceSnapshot = {
  /** UTC ISO-8601 timestamp */
  timestamp: string;
  sneakerId: string;
  marketplace: MarketplaceCode;
  lowestAsk: number | null;
  highestBid: number | null;
  lastSale: number | null;
  averageSale: number | null;
  /** Documented window for averageSale, e.g. "30d" */
  averageSaleWindow?: string | null;
  currency?: "USD" | string;
  source?: string;
};

export type PriceSnapshotInsert = Omit<PriceSnapshot, "timestamp"> & {
  timestamp?: string;
};

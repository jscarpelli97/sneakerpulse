import type { ClosetItem, FitBoard } from "@/lib/wardrobe/types";

export type PortfolioHolding = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  ticker: string;
  styleCode: string;
  image: string;
  size: string;
  quantity: number;
  /** What you paid per pair (USD). */
  costBasisUsd: number | null;
  acquiredAt: string | null;
  notes: string;
  addedAt: string;
};

export type PortfolioAccount = {
  email: string;
  username: string;
  /** PBKDF2 salt (base64). */
  salt: string;
  /** PBKDF2 hash (base64). */
  passwordHash: string;
  createdAt: string;
  holdings: PortfolioHolding[];
  /** Wardrobe closet — device-local. */
  closet: ClosetItem[];
  /** Saved outfit boards. */
  fits: FitBoard[];
};

export type PortfolioSession = {
  email: string;
  username: string;
};

import { HOMEPAGE_WATCHLIST_LIMIT } from "@/services/catalog/mapProductToCatalog";

const FREE_TOP = HOMEPAGE_WATCHLIST_LIMIT;

/** Soft-launch founding offer — copy only until checkout wires the cap. */
export const FOUNDING_MEMBER_CAP = 100;
export const FOUNDING_PRICE_USD = 10;
export const FOUNDING_TERM_LABEL = "first year";

export const PLUS_BENEFITS = [
  `Full top-seller board with Compare + Deal check (not just the free top ${FREE_TOP})`,
  "Portfolio + Wardrobe in Collection, with synced accounts",
  "Founding pricing while spots last — $10 for the first year",
] as const;

/** Free-tier bullets — homepage surface only. */
export const FREE_BENEFITS = [
  "No account required",
  "SPI Index — market premium vs retail",
  `Top ${FREE_TOP} seller ask board`,
] as const;

export type PlanCell = {
  /** Short cell label shown in the checklist. */
  label: string;
  /** Included / not / limited free tier / roadmap. */
  state: "yes" | "no" | "limited" | "soon";
};

export type PlanCompareRow = {
  id: string;
  feature: string;
  detail: string;
  free: PlanCell;
  plus: PlanCell;
};

/** Side-by-side checklist: what free keeps vs what Plus unlocks. */
export const PLAN_COMPARE: PlanCompareRow[] = [
  {
    id: "board",
    feature: "Top-seller board",
    detail: `Browse StockX-ranked pairs. Free stops at the top ${FREE_TOP}; Plus opens the full tracked board.`,
    free: { label: `Top ${FREE_TOP}`, state: "limited" },
    plus: { label: "Full board", state: "yes" },
  },
  {
    id: "compare",
    feature: "Head-to-head Compare",
    detail: "Built into Markets — search and stack 2–5 pairs on ask, premium, volume, and rank.",
    free: { label: `Top ${FREE_TOP}`, state: "limited" },
    plus: { label: "Full board", state: "yes" },
  },
  {
    id: "deal",
    feature: "Deal check",
    detail: "Built into Markets — size + offer → cop, stretch, or pass vs the board ask.",
    free: { label: `Top ${FREE_TOP}`, state: "limited" },
    plus: { label: "Full board", state: "yes" },
  },
  {
    id: "detail",
    feature: "Sneaker detail pages",
    detail: "Charts, size ladder, and the same deal check on a single SKU.",
    free: { label: `Top ${FREE_TOP}`, state: "limited" },
    plus: { label: "Full board", state: "yes" },
  },
  {
    id: "index",
    feature: "SPI Index",
    detail: "Basket read of market premium vs retail — free for everyone.",
    free: { label: "Included", state: "yes" },
    plus: { label: "Included", state: "yes" },
  },
  {
    id: "portfolio",
    feature: "Collection",
    detail: "Portfolio value and wardrobe fits — same account on any device.",
    free: { label: "Not on free homepage", state: "no" },
    plus: { label: "Included", state: "yes" },
  },
  {
    id: "freshness",
    feature: "Ask freshness",
    detail:
      "Board asks may use a daily snapshot or a live refresh depending on how data is connected. We stay clear about which mode you’re in.",
    free: { label: "Snapshot / limited", state: "limited" },
    plus: { label: "Full board access", state: "yes" },
  },
];

export type PlusChargeView = {
  id: string;
  status: string;
  amountUsd: number;
  amountSats: number | null;
  lightningInvoice: string | null;
  onchainAddress: string | null;
  uri: string | null;
  hostedCheckoutUrl: string | null;
  expiresAt: string | null;
  email: string;
  mock: boolean;
};

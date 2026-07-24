import { HOMEPAGE_WATCHLIST_LIMIT } from "@/services/catalog/mapProductToCatalog";

const FREE_TOP = HOMEPAGE_WATCHLIST_LIMIT;

export const PLUS_BENEFITS = [
  "Early access to GOAT / Stadium Goods tape as APIs land",
  `Full top-seller board with Compare + Deal check (not just the free top ${FREE_TOP})`,
  "Live ask refresh (when feeds are connected)",
  "Portfolio + Wardrobe in Collection, with synced accounts",
  "Restock Monitor — size restocks & soft price drops (coming soon)",
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
    id: "restock",
    feature: "Restock Monitor",
    detail: "Watch sizes come back in ask inventory, plus optional soft price-drop pings.",
    free: { label: "Not included", state: "no" },
    plus: { label: "Coming soon", state: "soon" },
  },
  {
    id: "live",
    feature: "Live ask refresh",
    detail: "Fresher StockX asks when KicksDB / feed credentials are connected.",
    free: { label: "Cached / limited", state: "limited" },
    plus: { label: "Priority when live", state: "yes" },
  },
  {
    id: "multi-venue",
    feature: "GOAT / Stadium Goods tape",
    detail: "Extra venues as APIs land — Plus members get early access.",
    free: { label: "Not included", state: "no" },
    plus: { label: "Early access", state: "soon" },
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

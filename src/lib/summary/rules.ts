import type { MarketTone, SignalDirection } from "@/types/summary";

export type SummaryRule = {
  id: string;
  price: SignalDirection;
  inventory: SignalDirection;
  tone: MarketTone;
  headline: string;
  body: string;
};

/**
 * Deterministic market-narrative rules.
 * Swap the composer for an LLM later; keep this table as the ground-truth playbook.
 */
export const MARKET_SUMMARY_RULES: SummaryRule[] = [
  {
    id: "price-up-inventory-down",
    price: "up",
    inventory: "down",
    tone: "bullish",
    headline: "Demand firming, supply tightening",
    body: "Demand appears to be increasing while supply is tightening.",
  },
  {
    id: "price-down-inventory-up",
    price: "down",
    inventory: "up",
    tone: "bearish",
    headline: "Supply weighing on the tape",
    body: "The market appears to be weakening due to increased supply.",
  },
  {
    id: "price-up-inventory-up",
    price: "up",
    inventory: "up",
    tone: "mixed",
    headline: "Bid lifting through expanding supply",
    body: "Prices are rising even as available inventory expands — demand is absorbing fresh supply.",
  },
  {
    id: "price-down-inventory-down",
    price: "down",
    inventory: "down",
    tone: "bearish",
    headline: "Soft tape despite thinner inventory",
    body: "Prices are easing even with tighter inventory, which often points to cooling demand.",
  },
  {
    id: "price-up-inventory-flat",
    price: "up",
    inventory: "flat",
    tone: "bullish",
    headline: "Steady inventory, rising asks",
    body: "Buying interest is lifting prices while inventory looks relatively stable.",
  },
  {
    id: "price-down-inventory-flat",
    price: "down",
    inventory: "flat",
    tone: "bearish",
    headline: "Prices easing on stable supply",
    body: "Prices are drifting lower while inventory levels look steady.",
  },
  {
    id: "price-flat-inventory-down",
    price: "flat",
    inventory: "down",
    tone: "mixed",
    headline: "Supply tightening first",
    body: "Inventory looks tighter, but price has not yet made a decisive move.",
  },
  {
    id: "price-flat-inventory-up",
    price: "flat",
    inventory: "up",
    tone: "mixed",
    headline: "Inventory building quietly",
    body: "Available supply is building without a clear directional price move.",
  },
  {
    id: "price-flat-inventory-flat",
    price: "flat",
    inventory: "flat",
    tone: "neutral",
    headline: "Balanced market",
    body: "The market looks balanced — no strong price or inventory signal right now.",
  },
];

export const INSUFFICIENT_RULE: SummaryRule = {
  id: "insufficient-data",
  price: "unknown",
  inventory: "unknown",
  tone: "insufficient",
  headline: "Insufficient market signal",
  body: "Not enough trusted price or inventory evidence to draft a confident summary yet.",
};

export function findSummaryRule(
  price: SignalDirection,
  inventory: SignalDirection,
): SummaryRule {
  if (price === "unknown" || inventory === "unknown") {
    return INSUFFICIENT_RULE;
  }
  return (
    MARKET_SUMMARY_RULES.find(
      (rule) => rule.price === price && rule.inventory === inventory,
    ) ?? INSUFFICIENT_RULE
  );
}

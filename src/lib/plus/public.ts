export const PLUS_BENEFITS = [
  "Live ask refresh (when feeds are connected)",
  "Deeper coverage beyond the free watchlist",
  "Richer alerts and portfolio cloud sync (rolling out)",
  "Early access to GOAT / Stadium Goods tape as APIs land",
] as const;

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

export const PLUS_BENEFITS = [
  "Full top-seller board (not just the free top 10)",
  "Email price alerts when asks cross your thresholds",
  "Restock Monitor — size restocks & soft price drops (coming soon)",
  "Live ask refresh (when feeds are connected)",
  "Portfolio cloud sync (rolling out)",
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

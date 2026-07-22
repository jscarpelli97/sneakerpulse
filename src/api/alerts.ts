import { apiPost } from "@/api/client";
import type { PriceAlert } from "@/types/market";

export type EvaluateAlertsResponse = {
  ok: boolean;
  checked?: number;
  triggered?: Array<PriceAlert & { price: number }>;
  webhooks?: string;
  error?: string;
};

export function evaluateAlerts(alerts: PriceAlert[]) {
  return apiPost<EvaluateAlertsResponse>("/api/alerts/evaluate", { alerts });
}

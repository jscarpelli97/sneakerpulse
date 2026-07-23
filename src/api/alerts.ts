import { apiPost } from "@/api/client";
import type { PriceAlert } from "@/types/market";

export type EvaluateAlertsResponse = {
  ok: boolean;
  checked?: number;
  triggered?: Array<PriceAlert & { price: number }>;
  emailed?: number;
  emailError?: string | null;
  webhooks?: string;
  plus?: boolean;
  error?: string;
};

export function evaluateAlerts(
  alerts: PriceAlert[],
  opts?: { email?: string; notifyEmail?: boolean },
) {
  return apiPost<EvaluateAlertsResponse>("/api/alerts/evaluate", {
    alerts,
    email: opts?.email,
    notifyEmail: opts?.notifyEmail ?? false,
  });
}

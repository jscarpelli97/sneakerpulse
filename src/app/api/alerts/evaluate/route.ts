import { NextResponse } from "next/server";
import { getMarketBySlug } from "@/services/market/getMarketBySlug";
import type { PriceAlert } from "@/types/market";

type EvaluateBody = {
  alerts?: PriceAlert[];
};

const MAX_ALERTS_PER_REQUEST = 25;

/**
 * Evaluates client-stored alert thresholds against live quotes.
 * Webhook delivery is intentionally disabled: an open endpoint that
 * server-fetches arbitrary URLs is an SSRF footgun for public deploys.
 */
export async function POST(request: Request) {
  let body: EvaluateBody = {};
  try {
    body = (await request.json()) as EvaluateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const alerts = (body.alerts ?? []).slice(0, MAX_ALERTS_PER_REQUEST);
  if (!Array.isArray(body.alerts) || alerts.length === 0) {
    return NextResponse.json({ ok: true, triggered: [], checked: 0 });
  }

  const bySlug = new Map<string, number | null>();
  const triggered: Array<PriceAlert & { price: number }> = [];

  for (const alert of alerts) {
    if (!alert?.slug || typeof alert.threshold !== "number") continue;
    if (!bySlug.has(alert.slug)) {
      const market = await getMarketBySlug(alert.slug);
      bySlug.set(alert.slug, market.ok ? market.data.price : null);
    }
    const price = bySlug.get(alert.slug);
    if (price == null) continue;
    const hit =
      alert.direction === "above"
        ? price >= alert.threshold
        : price <= alert.threshold;
    if (hit) {
      triggered.push({ ...alert, price, webhookUrl: undefined });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: alerts.length,
    triggered,
    webhooks: "disabled",
  });
}

import { NextResponse } from "next/server";
import { getMarketBySlug } from "@/lib/market/getMarketBySlug";
import type { PriceAlert } from "@/lib/market/types";

type EvaluateBody = {
  alerts?: PriceAlert[];
};

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

  const alerts = body.alerts ?? [];
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return NextResponse.json({ ok: true, triggered: [], checked: 0 });
  }

  const bySlug = new Map<string, number | null>();
  const triggered: Array<PriceAlert & { price: number }> = [];

  for (const alert of alerts) {
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
      triggered.push({ ...alert, price });
      if (alert.webhookUrl) {
        try {
          await fetch(alert.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sneakerpulse.alert",
              alert,
              price,
              at: new Date().toISOString(),
            }),
          });
        } catch {
          // webhook best-effort
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: alerts.length,
    triggered,
  });
}
